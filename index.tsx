import * as React from 'react';
import * as ReactDOM from 'react-dom';

export interface PopoutProps {
    hidden?: boolean;
    name?: string;
    onClose?: () => void;
    children?: any;
    options?: Partial<WindowFeaturesOptions>;
    html?: string;
}

export interface WindowFeaturesOptions {
    left: number;
    top: number;
    height: number;
    width: number;
    menubar: boolean;
    toolbar: boolean;
    location: boolean;
    status: boolean;
    resizable: boolean;
    scrollbars: boolean;
}

const UNIQUE_NAME = '__$$REACT_POPOUT_COMPONENT$$__';
const popouts: { [id: string]: Popout } = {};

export default class Popout extends React.Component<PopoutProps, {}> {
    private child: Window | null;

    private id: string;

    //private renderChildWindow: () => void;
    private container: HTMLElement;

    private setupCleanupCallbacks() {
        // Close the popout if main window is closed.
        window.addEventListener('unload', e => this.closeChildWindowIfOpened());

        if (!(window as any)[UNIQUE_NAME]) {
            (window as any)[UNIQUE_NAME] = {
                onChildClose: (id: string) => {
                    if (popouts[id].props.onClose) {
                        popouts[id].props.onClose!();
                    }
                },
            };
        }
    }

    private initializeChildWindow(id: string, child: Window) {
        popouts[id] = this;

        if (this.props.html) {
            child.document.write(this.props.html);
        }

        // Create a container element
        const container = child.document.createElement('div');
        container.id = id;

        // Create a document with the styles of the parent window first
        forEachStyleElement(window.document.head.childNodes, element => {
            child.document.head.appendChild(crossBrowserCloneNode(element, child.document));
        });

        child.document.body.appendChild(container);
        const unloadScriptContainer = child.document.createElement('script');
        unloadScriptContainer.innerHTML = `window.onbeforeunload = function(e) { window.opener.${UNIQUE_NAME}.onChildClose.call(window.opener, '${id}'); }`;
        child.document.body.appendChild(unloadScriptContainer);

        this.setupCleanupCallbacks();

        // Add style observer
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type == 'childList') {
                    forEachStyleElement(mutation.addedNodes, element => {
                        child.document.head.appendChild(
                            crossBrowserCloneNode(element, child.document)
                        );
                    });
                }
            });
        });

        const config = { childList: true };

        observer.observe(document.head, config);

        return container;
    }

    private openChildWindow = () => {
        const options = generateWindowFeaturesString(this.props.options || {});
        console.log(options);

        const name = getWindowName(this.props.name!);

        this.child = window.open('about:blank', name, options);
        this.id = `__${name}_container__`;

        this.container = this.initializeChildWindow(this.id, this.child!);
    };

    private closeChildWindowIfOpened = () => {
        if (isChildWindowOpened(this.child)) {
            this.child!.close();

            this.child = null;
            if (this.props.onClose) {
                this.props.onClose();
            }
        }
    };

    componentDidMount() {
        if (!this.props.hidden && !isChildWindowOpened(this.child)) {
            this.openChildWindow();
        }
    }

    componentWillUnmount() {
        this.closeChildWindowIfOpened();
    }

    render() {
        if (!this.props.hidden) {
            if (!isChildWindowOpened(this.child)) {
                this.openChildWindow();
            }

            return ReactDOM.createPortal(this.props.children, this.container);
        } else {
            this.closeChildWindowIfOpened();
            return null;
        }
    }
}

function isChildWindowOpened(child: Window | null) {
    return child && !child.closed;
}

function getWindowName(name: string) {
    return (
        name ||
        Math.random()
            .toString(12)
            .slice(2)
    );
}

function forEachStyleElement(
    nodeList: NodeList,
    callback: (element: HTMLElement, index?: number) => void,
    scope?: any
) {
    let element: HTMLElement;

    for (let i = 0; i < nodeList.length; i++) {
        element = nodeList[i] as HTMLElement;
        if (element.tagName == 'STYLE' || element.tagName == 'LINK') {
            callback.call(scope, element, i);
        }
    }
}

function crossBrowserCloneNode(element: HTMLElement, targetDocument: HTMLDocument) {
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

function generateWindowFeaturesString(optionsProp: Partial<WindowFeaturesOptions>) {
    function valueOf(value: number | boolean | undefined): string | undefined {
        if (typeof value === 'boolean') {
            return value ? '1' : '0';
        } else if (value) {
            return String(value);
        }
    }

    let options: WindowFeaturesOptions = {
        left: 0,
        top: 0,
        height: 600,
        width: 800,
        location: false,
        menubar: false,
        resizable: false,
        scrollbars: false,
        status: false,
        toolbar: false,
    };

    options = { ...options, ...optionsProp };

    return Object.getOwnPropertyNames(options)
        .map((key: keyof WindowFeaturesOptions) => `${key}=${valueOf(options[key])}`)
        .join(',');
}
