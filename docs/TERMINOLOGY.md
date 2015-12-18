# TERMINOLOGY

## App

An application context.
You can run this context as daemon that serve your integration or as client that connect to another yesbee application context.

## Execution

Single execution context for each command executed. Single application will have one or more execution contexts.

## Component

Components handle each particular integration function. component act as factory of endpoints.

## Service

Service wrap up single domain of business process as one. You may think service as single integration business model.

TBD

## Command

Single command will represent single action to start or modify behavior of yesbee app.

## Message

Something to transferable inside route and in-between routes

Structure

- {Message}
    - {string}  id
    x- {string}  uri
    - {object}  properties
        - {Message} original
    - {object}  headers
    - {var}     body