User Actions
============

The user actions UI for Mono.

## How to use

Include the module in the application descriptor.

```js
"MIID_NAME": {
    "module": "github/IonicaBizau/user-actions/MODULE_VERSION",
    "roles": MONO_ROLES,
    "config": {
        "html": PATH_TO_HTML_FILE
        "waitFor": WAIT_FOR_CONFIGURATION
    }
}
```

The html file that is loaded by this miid must have elements with known selectors. Example:

```html
<span class="myClass">
    <button data-action="action-1">Action 1</button>
    <button data-action="action-2">Action 2</button>
    <button data-action="action-3">Action 3</button>
    <button data-action="action-4">Action 4</button>
    ...
    <button data-action="action-n">Action n</button>
</span>
```

In the CRUD role object you will define the actions:

```js
role_name: {
    _id: ids.roles.role_name,
    _tp: [ids.templates.d_roles],
    name: 'Role Name',
    actions: [
        {
            template: 'TEMPLATE_ID',
            selector: '[data-action="action-1"],[data-action="action-2"]',
            filter:   {
                'some': 'query'
            }
        },
    ]
},
```

## Changelog

No stable release yet.
