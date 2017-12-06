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

    private container: HTMLElement;

    public styleElement: HTMLStyleElement | null;

    public child: Window | null;

    private setupCleanupCallbacks() {
        // Close the popout if main window is closed.
        window.addEventListener('unload', e => this.closeChildWindowIfOpened());

        globalContext.set('onChildClose', (id: string) => {
            if (popouts[id].props.onClose) {
                popouts[id].props.onClose!();
            }
        });

        globalContext.set(
            'onBeforeUnload',
            (id: string, evt: BeforeUnloadEvent) => {
                if (popouts[id].props.onBeforeUnload) {
                    return popouts[id].props.onBeforeUnload!(evt);
                }
            }
        );
    }

    private setupStyleElement(child: Window) {
        this.styleElement = child.document.createElement('style');
        this.styleElement.setAttribute('data-this-styles', 'true');
        this.styleElement.type = 'text/css';

        child.document.head.appendChild(this.styleElement);
    }

    private initializeChildWindow(id: string, child: Window) {
        popouts[id] = this;

        let container: HTMLDivElement;

        if (this.props.html) {
            child.document.write(this.props.html);
            const head = child.document.head;

            let cssText = '';

            for (let i = window.document.styleSheets.length - 1; i >= 0; i--) {
                const rules = (window.document.styleSheets[i] as CSSStyleSheet)
                    .cssRules;
                for (let j = 0; j < rules.length; j++) {
                    cssText += rules[j].cssText;
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
                const cssText = (window.document.styleSheets[
                    i
                ] as CSSStyleSheet).cssText;
                childHtml += `<style>${cssText}</style>`;
            }
            childHtml += `</head><body><div id="${id}"></div></body></html>`;
            child.document.write(childHtml);
            container = child.document.getElementById(id)! as HTMLDivElement;
        }

        // Create a document with the styles of the parent window first
        this.setupStyleElement(child);

        //child.document.body.appendChild(container);
        const unloadScriptContainer = child.document.createElement('script');
        unloadScriptContainer.innerHTML = `
        
        window.onbeforeunload = function(e) {
            var result = window.opener.${
                globalContext.id
            }.onBeforeUnload.call(window, '${id}', e);

            if (result) {
                window.opener.${
                    globalContext.id
                }.startMonitor.call(window.opener, '${id}');

                e.returnValue = result;
                return result;
            } else {
                window.opener.${
                    globalContext.id
                }.onChildClose.call(window.opener, '${id}');
            }
        };
        `;

        child.document.body.appendChild(unloadScriptContainer);

        this.setupCleanupCallbacks();

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

        return container;
    }

    private openChildWindow = () => {
        const options = generateWindowFeaturesString(this.props.options || {});

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

            ReactDOM.render(this.props.children, this.container);

            return null;
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
        if (element.tagName == 'STYLE') {
            callback.call(scope, element, i);
        }
    }
}
