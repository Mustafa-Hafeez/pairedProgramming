<h1 align="center">Welcome to Pybuggys</h1>

> A python interpreter built for the web.

### 🏠 [Homepage](https://github.com/FloofyInc/pybuggy)

## Directory Structure

```
.
├── ./.github
├── ./
│   └── client/ (react frontend)
├── ./.gitignore
├── ./.env (not versioned)
├── ./.env.template
└── ./server.js (express)
```

## MongoDB Setup

1. This project is created with MongoDb Cloud. Create your own project/cluster [here](https://www.mongodb.com/cloud) for testing purposes.
2. Make acopy and rename `pybuggy/.env.template` to  `pybuggy/.env`
3. Edit the all fields in `< ... >` with your mongo cluster information.

## .env Setup
> Make acopy and rename `pybuggy/.env.template` to  `pybuggy/.env` and Edit the all fields in `< ... >`.

```sh
# MongoDB connection URL
DB_HOST=mongodb+srv://<user>:<password>@<cluster url>/<DB name>?retryWrites=true
# Application secret for token generation and verification
SECRET=<secret>
```

## Available commands

```sh
# install all prerequisites
npm install
# compile and bundle all source code
npm run build
# start the main backend server with build files
npm start
# start the react dev server
npm run dev
# run both backend and frontend tests
npm run test
# run frontend tests
npm run test-frontend
# run backend tests
npm run dev
```

## Authors

👤 **Angela Zavaleta**

* Website: https://angelazb.github.io
* Github: [@angelazb](https://github.com/orgs/FloofyInc/people/angelazb)

👤 **Kalindu De Costa**

* Website: https://kdecosta.com/
* Github: [@kalindudc](https://github.com/kalindudc)

👤 **Mahima Bhayana**

* Website: https://mahima.io
* Github: [@mahumabhayana](https://github.com/mahimabhayana)

👤 **Rachel D'souza**

* Github: [@rad-souza](https://github.com/rad-souza)


## 🤝 Contributing

Contributions, issues and feature requests are welcome!<br />Feel free to check [issues page](https://github.com/FloofyInc/pybuggy/issues).

Note: All PRs must pass existing unit tests and if any new features are introduced, please add necessary unittests.

## Show your support

Give a ⭐️ if this project helped you!
