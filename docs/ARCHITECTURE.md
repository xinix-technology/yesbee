# ARCHITECTURE

- component(a)
    + source(a)
    + source(b)
    + processor(a)
- component(b)
    + source(c)
    + processor(b)
    + processor(c)
    + processor(d)

- service(a)
    + route(a)
        * sources
            - source(a)
            - source(b)
        * processors
            - processor(a)
            - processor(b)
    + route(b)
        * sources
            - source(c)
        * processors
            - processor(c)
            - processor(d)
