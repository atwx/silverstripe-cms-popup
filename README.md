# silverstripe-cms-popup

Opens modal dialogs in the SilverStripe CMS from a button in the form action menu. Four built-in content types: **Search** (search with result selection), **Batch** (sequential processing of a queue), **Content** (generic HTML loader), and **FormSchema** (full SilverStripe form including HTMLEditorField).

**Requirements:** SilverStripe 6, PHP 8.2+

---

## Installation

```bash
composer require atwx/silverstripe-cms-popup
```

The module registers itself automatically in `LeftAndMain`. No additional YAML configuration required.

---

## Search modal

Opens a dialog with a server-rendered search form. The user enters search terms; results are loaded via AJAX. Clicking a result fires a `cms-modal:select` event on the triggering button.

```php
use Atwx\CmsPopup\Forms\CmsModalSearchAction;

$action = CmsModalSearchAction::create('findRecord', 'Find record')
    ->setModalTitle('Select a record')
    ->setModalSize('md')                   // sm | md (default) | lg
    ->setFormEndpoint($this->Link('searchForm'))
    ->setResultsEndpoint($this->Link('searchResults'));
```

**Form endpoint** (`searchForm`): Returns HTML containing a SilverStripe form. The form is rendered inside the modal. Text field changes trigger an automatic search (300 ms debounce); submitting the form triggers it immediately.

**Results endpoint** (`searchResults`): Receives form field values as query parameters (e.g. `?q=search+term`). Returns HTML. Clickable elements must carry a `data-cms-select` attribute containing a JSON payload:

```php
public function searchResults(): string
{
    $q = $this->getRequest()->getVar('q');
    $results = MyRecord::get()->filter('Title:PartialMatch', $q);

    $html = '';
    foreach ($results as $record) {
        $payload = json_encode(['id' => $record->ID, 'title' => $record->Title]);
        $html .= "<button type='button' data-cms-select='{$payload}'>{$record->Title}</button>";
    }
    return $html;
}
```

**Listening to the select event** (optional, in your own JS):

```js
document.querySelector('.my-trigger-button').addEventListener('cms-modal:select', (e) => {
    const { id, title } = e.detail;
    // Write the value into a form field, etc.
});
```

---

## Batch modal

Opens a dialog with a configuration form. After clicking "Start", queue items are sent one by one to an action endpoint; progress is displayed live.

```php
use Atwx\CmsPopup\Forms\CmsModalBatchAction;

$action = CmsModalBatchAction::create('runBatch', 'Run batch')
    ->setModalTitle('Translate all pages')
    ->setModalSize('lg')
    ->setFormEndpoint($this->Link('batchForm'))
    ->setActionEndpoint($this->Link('batchAction'))
    ->setQueueEndpoint($this->Link('batchQueue'))  // optional
    ->setSubmitLabel('Start')                       // default: "Start"
    ->setBaseQueue([                                // optional static queue
        ['id' => 1, 'title' => 'Home'],
        ['id' => 2, 'title' => 'About'],
    ]);
```

**Form endpoint** (`batchForm`): Returns HTML containing a SilverStripe form with options the user configures before starting. Can return an empty string if no configuration is needed.

**Queue endpoint** (`batchQueue`, optional): Called when a field named `recursive` is checked in the form. Returns JSON:

```json
{
    "items": [
        { "id": 10, "title": "Subpage A" },
        { "id": 11, "title": "Subpage B", "enabled": false }
    ]
}
```

Items with `"enabled": false` are skipped. The fetched items are merged with `setBaseQueue()`.

**Action endpoint** (`batchAction`): Called via `POST` for each queue item. The request body contains the queue item merged with the form values as JSON:

```json
{ "id": 1, "title": "Home", "recursive": true }
```

Return a response using the response helpers:

```php
use Atwx\CmsPopup\Http\CmsPopupBatchResponse;
use Atwx\CmsPopup\Http\CmsPopupBatchDetail;

public function batchAction(): HTTPResponse
{
    $body = json_decode($this->getRequest()->getBody(), true);
    $record = MyPage::get()->byID($body['id']);

    if (!$record) {
        return CmsPopupBatchResponse::error('Record not found');
    }

    try {
        $record->doSomething();
        return CmsPopupBatchResponse::success('Processed', [
            CmsPopupBatchDetail::info('en_US', 'OK'),
            CmsPopupBatchDetail::info('de_DE', 'OK'),
        ]);
    } catch (\Exception $e) {
        return CmsPopupBatchResponse::error($e->getMessage(), [
            CmsPopupBatchDetail::error('en_US', 'Failed'),
        ]);
    }
}
```

### Response helpers

| Method | HTTP status | Modal display |
|---|---|---|
| `CmsPopupBatchResponse::success($message, $details)` | 200 | green check |
| `CmsPopupBatchResponse::warning($message, $details)` | 200 | yellow warning |
| `CmsPopupBatchResponse::error($message, $details)` | 422 | red cross |

### Detail helpers

Used to populate the `$details` list shown beneath each item:

```php
CmsPopupBatchDetail::info('en_US', 'Translated')   // green
CmsPopupBatchDetail::warning('de_DE', 'Skipped')    // yellow
CmsPopupBatchDetail::error('fr_FR', 'API error')    // red
```

---

## Content modal

Loads arbitrary HTML from a URL into the dialog. Useful for simple informational displays without user interaction.

```php
use Atwx\CmsPopup\Forms\CmsModalAction;

$action = CmsModalAction::create('showInfo', 'Show details')
    ->setModalComponent('CmsModalContent')
    ->setModalTitle('Information')
    ->setModalData(['url' => $this->Link('infoHtml')]);
```

---

## Button icon

A SilverStripe admin font-icon class can be added to any action button:

```php
$action->setButtonIcon('font-icon-search');
$action->setButtonIcon('font-icon-sync');
```

---

## Modal sizes

| Value | Width |
|---|---|
| `sm` | 480 px |
| `md` | 640 px (default) |
| `lg` | 860 px |

---

## Writing the selected value into a form field

Typical pattern: open search modal → write selected value into a hidden field → save the form.

```php
// In getCMSFields():
$hiddenId    = HiddenField::create('MyRecordID');
$hiddenTitle = ReadonlyField::create('MyRecordTitle', 'Selected record');

$search = CmsModalSearchAction::create('pickRecord', 'Choose record')
    ->setFormEndpoint($this->Link('searchForm'))
    ->setResultsEndpoint($this->Link('searchResults'));
```

```js
// Listen for selection in your own entwine or JS module:
button.addEventListener('cms-modal:select', (e) => {
    document.querySelector('[name=MyRecordID]').value = e.detail.id;
    document.querySelector('[name=MyRecordTitle]').value = e.detail.title;
});
```

---

## Custom content components

The modal uses the SilverStripe Injector. Register a custom React component and reference it by name:

```js
// In your own bundle.js
import Injector from 'lib/Injector';
import MyCustomModal from './MyCustomModal';

Injector.component.register('MyCustomModal', MyCustomModal);
```

```php
$action->setModalComponent('MyCustomModal');
$action->setModalData(['someParam' => 'value']);
```

The component receives the props `data` (from `setModalData()`), `onClose` (callback), and `onSelect` (callback — dispatches `cms-modal:select` on the trigger element).

---

## FormSchema modal

Opens a full SilverStripe form in the modal using `FormBuilderLoader`. Supports all CMS field types including `HTMLEditorField` (TinyMCE). The modal closes automatically after a successful save.

```php
use Atwx\CmsPopup\Forms\CmsModalFormSchemaAction;

$action = CmsModalFormSchemaAction::create('editRecord', 'Record bearbeiten')
    ->setSchemaUrl('/admin/pages/myPopupForm?recordID=' . $this->ID)
    ->setFormIdentifier('myPopup_' . $this->ID)   // unique per record
    ->setModalTitle('Record bearbeiten')
    ->setModalSize('lg');                          // lg recommended for HTMLEditor
```

### PHP endpoint (LeftAndMainExtension)

Create a `LeftAndMainExtension` on the relevant admin controller and declare two `allowed_actions`: one for the schema (GET) and one for saving (POST).

```php
use SilverStripe\Core\Extension;
use SilverStripe\Control\HTTPResponse;
use SilverStripe\Forms\FieldList;
use SilverStripe\Forms\Form;
use SilverStripe\Forms\FormAction;
use SilverStripe\Forms\HTMLEditor\HTMLEditorField;
use SilverStripe\Forms\TextField;

class MyPopupExtension extends Extension
{
    private static array $allowed_actions = [
        'myPopupForm',
        'saveMyPopup',
    ];

    public function myPopupForm(): HTTPResponse
    {
        $id = (int) $this->owner->getRequest()->getVar('recordID');
        $record = MyRecord::get()->byID($id);

        if (!$record || !$record->canEdit()) {
            return $this->owner->httpError(403);
        }

        $form = $this->buildForm($record);
        return $this->owner->getSchemaResponse('myPopup_' . $id, $form);
    }

    public function saveMyPopup(): HTTPResponse
    {
        $id = (int) $this->owner->getRequest()->getVar('recordID');
        $record = MyRecord::get()->byID($id);

        if (!$record || !$record->canEdit()) {
            return $this->owner->httpError(403);
        }

        $form = $this->buildForm($record);
        $form->loadDataFrom($this->owner->getRequest()->postVars());

        if ($form->validationResult()->isValid()) {
            $form->saveInto($record);
            $record->write();
        }

        return $this->owner->getSchemaResponse('myPopup_' . $id, $form);
    }

    protected function buildForm(MyRecord $record): Form
    {
        $fields = FieldList::create(
            TextField::create('Title', 'Titel'),
            HTMLEditorField::create('Content', 'Inhalt')->setRows(8),
        );
        $actions = FieldList::create(
            FormAction::create('saveMyPopup', 'Speichern')
                ->addExtraClass('btn-primary'),
        );
        $form = Form::create($this->owner, 'myPopupForm', $fields, $actions);
        $form->loadDataFrom($record);
        $form->setFormAction(
            $this->owner->Link('saveMyPopup') . '?recordID=' . $record->ID
        );
        return $form;
    }
}
```

Apply the extension in YAML:

```yaml
SilverStripe\CMS\Controllers\CMSPageEditController:
  extensions:
    - MyNamespace\MyPopupExtension
```

### Using the button from a GridField column

For a per-row popup button inside a `GridField`, use `GridField_ColumnProvider` and render the trigger element directly as HTML. The `cms-modal-action` CSS class is picked up by the module's jQuery Entwine and opens the modal without any additional JavaScript.

```php
use SilverStripe\Admin\LeftAndMain;
use SilverStripe\Forms\GridField\GridField;
use SilverStripe\Forms\GridField\GridField_ColumnProvider;
use SilverStripe\ORM\DataObject;

class MyGridFieldPopupColumn implements GridField_ColumnProvider
{
    public function augmentColumns(GridField $gridField, array &$columns): void
    {
        if (!in_array('PopupEdit', $columns, true)) {
            $columns[] = 'PopupEdit';
        }
    }

    public function getColumnsHandled(GridField $gridField): array
    {
        return ['PopupEdit'];
    }

    public function getColumnContent(GridField $gridField, DataObject $record, string $columnName): string
    {
        if (!$record->canEdit()) {
            return '';
        }

        $schemaUrl = LeftAndMain::singleton()->Link('myPopupForm') . '?recordID=' . $record->ID;
        $modalData = htmlspecialchars(
            json_encode([
                'schemaUrl'  => $schemaUrl,
                'identifier' => 'myPopup_' . $record->ID,
            ]),
            ENT_QUOTES
        );

        return sprintf(
            '<a href="#" role="button"'
            . ' class="btn btn--no-text btn--icon-md cms-modal-action"'
            . ' data-modal-component="CmsModalFormSchema"'
            . ' data-modal-title="Record bearbeiten"'
            . ' data-modal-data="%s"'
            . ' data-modal-size="lg">'
            . '<span class="btn__icon font-icon-edit"></span>'
            . '</a>',
            $modalData
        );
    }

    public function getColumnAttributes(GridField $gridField, DataObject $record, string $columnName): array
    {
        return ['class' => 'grid-field__col-compact'];
    }

    public function getColumnMetadata(GridField $gridField, string $columnName): array
    {
        return ['title' => ''];
    }
}
```

Add the column to the GridField config:

```php
$config->addComponent(new MyGridFieldPopupColumn());
```

---

## Building assets

```bash
cd vendor/atwx/silverstripe-cms-popup
npm install
npm run build   # production
npm run dev     # development
npm run watch   # watch mode
```

Output: `client/dist/js/bundle.js` and `client/dist/atwx/silverstripe-cms-popup` (CSS).
