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
        * processors
            - processor(a) 
            - processor(b) 
    + route(b)
        * sources
            - source(c)
        * processors
            - processor(c)
            - processor(d)


SA => |QAB| => PB => |QBC| => PC

SA() {
    PB() {
        PC() {
            trow
        }
        fds
    } 
    dsa
} 

