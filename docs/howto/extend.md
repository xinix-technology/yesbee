# Howto: Extend

You can develop your business flow as services. 

## JS DSL

```
service.from('direct:foo', { someOptions: 'foo' })
  .to('direct:bar', { someOptions: 'bar' });

service.from('direct:bar')
  .to( () => dosomething() )
```

## JSON DSL

Unimplemented yet!

```
{
  "routes": [
    {
      "from": [
        [ "direct:foo", { "someOptions": "foo" } ]
      ],
      "to": [
        [ "direct:bar", { "someOptions": "bar" } ]
      ]
    },
    {
      "from": [
        [ "direct:bar" ]
      ],
      "to": [
        [ () => dosomething() ]
      ]
    }
  ]
}
```

## XML DSL

Unimplemented yet!

```
<service>
  <route>
    <from uri="direct:foo#someOptions=foo" />
    <to uri="direct:bar#someOptions=bar" />
  </route>
  <route>
    <from uri="direct:bar" />
    <process>
      dosomething()
    </process>
  </route>
</service>
```
