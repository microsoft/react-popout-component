export function crossBrowserCloneNode(
    element: HTMLElement,
    targetDocument: HTMLDocument
) {
    const cloned = targetDocument.createElement(element.tagName) as HTMLElement;
    cloned.innerHTML = element.innerHTML;

    if (element.hasAttributes()) {
        let attribute: Attr;
        for (let i = 0; i < element.attributes.length; i++) {
            attribute = element.attributes[i];
            cloned.setAttribute(attribute.name, attribute.value);
        }
    }

    return cloned;
}
