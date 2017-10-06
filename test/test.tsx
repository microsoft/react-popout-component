import * as React from 'react';
import * as ReactDOM from 'react-dom';
import MyPopout from './MyPopout';

import './test.css';

class App extends React.Component<any, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            open: {
                '0': false,
                '1': false,
                '2': false,
            },
            message: 'Hello World!',
        };
    }

    openWindow(id: string) {
        let open = this.state.open;
        open[id] = true;

        this.setState({ open });

        console.log(this.state);
    }

    closeWindow(id: string) {
        let open = this.state.open;
        open[id] = false;

        this.setState({ open });

        console.log(this.state);
    }

    onClose(id: string) {
        let open = this.state.open;
        open[id] = false;

        this.setState({ open: open });

        console.log(this.state);
    }

    changeText() {
        this.setState({
            message:
                'Hello ' +
                Math.random()
                    .toString(12)
                    .slice(2),
        });

        console.log(this.state);
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
                            />
                        )}

                        <button onClick={() => this.openWindow(name)}>Open {name}</button>
                        <button onClick={() => this.closeWindow(name)}>Close {name}</button>
                    </div>
                ))}

                <button onClick={() => this.changeText()}>Change Text</button>
            </div>
        );
    }
}

ReactDOM.render(<App />, document.getElementById('test'));
