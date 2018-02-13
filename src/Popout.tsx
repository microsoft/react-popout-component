import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PopoutProps } from './PopoutProps';
import { generateWindowFeaturesString } from './generateWindowFeaturesString';
import { popouts } from './popouts';
import { crossBrowserCloneNode } from './crossBrowserCloneNode';
import * as globalContext from './globalContext';
import './childWindowMonitor';

export class Popout extends React.Component<PopoutProps, {}> {
    private id: string;

    private container: HTMLElement | null;

    private setupAttempts = 0;

    public styleElement: HTMLStyleElement | null;

    public child: Window | null;

    private setupOnCloseHandler(id: string, child: Window) {
        // For Edge, IE browsers, the document.head might not exist here yet. We will just simply attempt again when RAF is called
        if (child.document.head && this.setupAttempts < 5) {
            const unloadScriptContainer = child.document.createElement('script');
            unloadScriptContainer.innerHTML = `

            window.onbeforeunload = function(e) {
                var result = window.opener.${
                globalContext.id
                }.onBeforeUnload.call(window, '${id}', e);

                if (result) {
                    window.opener.${globalContext.id}.startMonitor.call(window.opener, '${id}');

                    e.returnValue = result;
                    return result;
                } else {
                    window.opener.${globalContext.id}.onChildClose.call(window.opener, '${id}');
                }
            };
            `;

            child.document.head.appendChild(unloadScriptContainer);

            this.setupCleanupCallbacks();
        } else {
            this.setupAttempts++;
            setTimeout(() => this.setupOnCloseHandler(id, child), 50);
        }
    }

    private setupCleanupCallbacks() {
        // Close the popout if main window is closed.
        window.addEventListener('unload', e => this.closeChildWindowIfOpened());

        globalContext.set('onChildClose', (id: string) => {
            if (popouts[id].props.onClose) {
                popouts[id].props.onClose!();
            }
        });

        globalContext.set('onBeforeUnload', (id: string, evt: BeforeUnloadEvent) => {
            if (popouts[id].props.onBeforeUnload) {
                return popouts[id].props.onBeforeUnload!(evt);
            }
        });
    }

    private setupStyleElement(child: Window) {
        this.styleElement = child.document.createElement('style');
        this.styleElement.setAttribute('data-this-styles', 'true');
        this.styleElement.type = 'text/css';

        child.document.head.appendChild(this.styleElement);
    }

    private injectHtml(id: string, child: Window) {
        let container: HTMLDivElement;

        if (this.props.html) {
            child.document.write(this.props.html);
            const head = child.document.head;

            let cssText = '';

            for (let i = window.document.styleSheets.length - 1; i >= 0; i--) {
                let styleSheet = (window.document.styleSheets[i] as CSSStyleSheet);
                try {
                    const rules = styleSheet.cssRules;

                    if (rules) {
                        for (let j = 0; j < rules.length; j++) {
                            cssText += rules[j].cssText;
                        }
                    }
                } catch {
                    // We're primarily looking for a security exception here.
                    // See https://bugs.chromium.org/p/chromium/issues/detail?id=775525
                    // Try to just embed the style element instead.
                    let styleElement = child.document.createElement('link');
                    styleElement.type = styleSheet.type;
                    styleElement.rel = 'stylesheet';
                    styleElement.href = styleSheet.href;
                    head.appendChild(styleElement);
                }
            }

            const style = child.document.createElement('style');
            style.innerHTML = cssText;

            head.appendChild(style);
            container = child.document.createElement('div');
            container.id = id;
            child.document.body.appendChild(container);
        } else {
            let childHtml = '<!DOCTYPE html><html><head>';
            for (let i = window.document.styleSheets.length - 1; i >= 0; i--) {
                const cssText = (window.document.styleSheets[i] as CSSStyleSheet).cssText;
                childHtml += `<style>${cssText}</style>`;
            }
            childHtml += `</head><body><div id="${id}"></div></body></html>`;
            child.document.write(childHtml);
            container = child.document.getElementById(id)! as HTMLDivElement;
        }

        // Create a document with the styles of the parent window first
        this.setupStyleElement(child);

        return container;
    }

    private setupStyleObserver(child: Window) {
        // Add style observer for legacy style node additions
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
    }

    private initializeChildWindow(id: string, child: Window) {
        popouts[id] = this;

        if (!this.props.url) {
            const container: HTMLDivElement = this.injectHtml(id, child);
            this.setupStyleObserver(child);
            this.setupOnCloseHandler(id, child);
            return container;
        } else {
            this.setupOnCloseHandler(id, child);

            return null;
        }
    }

    private openChildWindow = () => {
        const options = generateWindowFeaturesString(this.props.options || {});

        const name = getWindowName(this.props.name!);

        this.child = validatePopupBlocker(
            window.open(this.props.url || 'about:blank', name, options)
        );

        if (!this.child && this.props.onBlocked) {
            this.props.onBlocked();
        } else {
            this.id = `__${name}_container__`;
            this.container = this.initializeChildWindow(this.id, this.child!);
        }
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

    private renderChildWindow() {
        if (this.props.url && !validateUrl(this.props.url!)) {
            throw new Error('react-popup-component error: cross origin URLs are not supported');
        }

        if (!this.props.hidden) {
            if (!isChildWindowOpened(this.child)) {
                this.openChildWindow();
            }

            if (!this.props.url) {
                ReactDOM.render(this.props.children, this.container);
            }
        } else {
            this.closeChildWindowIfOpened();
        }
    }

    componentDidUpdate() {
        this.renderChildWindow();
    }

    componentDidMount() {
        this.renderChildWindow();
    }

    componentWillUnmount() {
        this.closeChildWindowIfOpened();
    }

    render() {
        return null;
    }
}

function validateUrl(url: string) {
    const parser = document.createElement('a');
    parser.href = url;

    const current = window.location;

    return (
        (!parser.hostname || current.hostname == parser.hostname) &&
        (!parser.protocol || current.protocol == parser.protocol)
    );
}

function validatePopupBlocker(child: Window) {
    if (!child || child.closed || typeof child.closed == 'undefined') {
        return null;
    }

    return child;
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
        if (element.tagName == 'STYLE') {
            callback.call(scope, element, i);
        }
    }
}
