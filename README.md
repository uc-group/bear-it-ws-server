# bear-it-ws-server

This is the WebSocket server for the [BearIT project](https://github.com/uc-group/bear-it).

## Building

```bash
npm run build
```

## Running

```bash
npm start
```

## Configuration

Add config.json file where you are running server.

```json
{
  "bearitUrl": "http://server",
  "bearitPublicUrl": "http://localhost",
  "port": 300
}
```

| property        | description                                 |
| --------------- | ------------------------------------------- |
| bearitUrl       | url to the server (don't have to be public) |
| bearitPublicUrl | the public url to the server                |
| port            | Port on which the server will run           |

## Building and running docker image

```
docker build -t image/name:tag .
```

```
docker run --rm image/name:tag
```

[Read more](./docs/index.md)