// // Update TinyMCE initialization
// function initializeRichEditor(elementId, options = {}) {
//     return tinymce.init({
//         selector: `#${elementId}`,
//         height: options.height || 400,
//         menubar: false,
//         plugins: [
//             'advlist', 'autolink', 'lists', 'link', 'charmap',
//             'searchreplace', 'visualblocks', 'code', 'fullscreen',
//             'insertdatetime', 'table', 'wordcount', 'checklist'
//         ],
//         toolbar: 'undo redo | ' +
//                 'bold italic | bullist numlist checklist | ' +
//                 'link | removeformat',
//         content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
//         ...options
//     });
// }

function initializeMarkdownEditor(elementId, options = {}) {
    return new EasyMDE({
        element: document.getElementById(elementId),
        spellChecker: false,
        autofocus: false,
        status: ['lines', 'words'],
        toolbar: [
            {
                name: "bold",
                action: EasyMDE.toggleBold,
                className: "fa fa-bold",
                title: "Bold",
            },
            {
                name: "italic",
                action: EasyMDE.toggleItalic,
                className: "fa fa-italic",
                title: "Italic",
            },
            "|",
            {
                name: "heading",
                action: EasyMDE.toggleHeadingSmaller,
                className: "fa fa-header",
                title: "Heading",
            },
            "|",
            {
                name: "bullet-list",
                action: EasyMDE.toggleUnorderedList,
                className: "fa fa-list-ul",
                title: "Bullet List",
            },
            {
                name: "number-list",
                action: EasyMDE.toggleOrderedList,
                className: "fa fa-list-ol",
                title: "Number List",
            },
            "|",
            {
                name: "preview",
                action: EasyMDE.togglePreview,
                className: "fa fa-eye no-disable",
                title: "Preview",
            }
        ],
        placeholder: options.placeholder || 'Type here...',
        minHeight: options.height || '200px'
    });
}