import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MyPopout from './MyPopout';
import { Popout } from '../src/Popout';
import { insertPopoutStylesheetRule } from '../src/insertPopoutStylesheetRule';

import './test.css';

class App extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            open: {
                '0': false,
                '1': false,
                '2': false,
                '3': false,
            },
            message: 'Hello World!',
        };
    }

    openWindow(id: string) {
        let open = this.state.open;
        open[id] = true;

        this.setState({ open });
    }

    closeWindow(id: string) {
        let open = this.state.open;
        open[id] = false;

        this.setState({ open });
    }

    onClose(id: string) {
        let open = this.state.open;
        open[id] = false;

        this.setState({ open: open });
    }

    onUrlClose() {
        let open = this.state.open;
        open['3'] = false;

        this.setState({
            open: open,
            message: 'closed the url one',
        });
    }

    changeText() {
        this.setState({
            message:
                'Hello ' +
                Math.random()
                    .toString(12)
                    .slice(2),
        });
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.log(error, errorInfo);
    }

    render() {
        return (
            <div>
                <h1>Popout</h1>
                {['0', '1', '2'].map(name => (
                    <div key={name}>
                        {this.state.open[name] && (
                            <MyPopout
                                name={name}
                                message={this.state.message}
                                onClose={() => this.onClose(name)}
                                onBeforeUnload={evt => {
                                    if (name == '0') {
                                        return 'Are you sure?!';
                                    }
                                }}
                            />
                        )}

                        <button onClick={() => this.openWindow(name)}>
                            Open {name}
                        </button>
                        <button onClick={() => this.closeWindow(name)}>
                            Close {name}
                        </button>
                    </div>
                ))}

                <div>
                    {this.state.open['3'] && (
                        <Popout
                            name={'3'}
                            url="test.html"
                            onClose={() => this.onUrlClose()}
                        />
                    )}

                    <button onClick={() => this.openWindow('3')}>
                        Open {'3'}
                    </button>
                    <button onClick={() => this.closeWindow('3')}>
                        Close {'3'}
                    </button>
                </div>

                <button onClick={() => this.changeText()}>Change Text</button>
            </div>
        );
    }
}

const style = document.createElement('style');

style.setAttribute('data-merge-styles', 'true');
style.type = 'text/css';

document.head.appendChild(style);

(window as any).insertRule = (rule: string) => {
    (style.sheet as any).insertRule(rule, (style.sheet as any).cssRules.length);
    insertPopoutStylesheetRule(rule);
};

ReactDOM.render(<App />, document.getElementById('test'));
