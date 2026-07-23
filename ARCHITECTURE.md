# web-have-sound

## Navigation

```mermaid
graph LR
    SO[System Overview] --> CD[Core Engine Components]
    CD --> DF[Audio Synthesis Flow]
```

<!-- diagram:overview:system -->
## System Overview

```mermaid
graph TD
    subgraph Browser Environment
        DOM[DOM / UI Events]
        WebAudio[(Web Audio API)]
    end

    subgraph web-have-sounds Library
        Binding[Declarative Binding]
        Engine[Audio Engine]
        Catalog[Sound Catalog]
    end

    subgraph Integrations
        NuxtDocs[Nuxt Documentation Site]
        VuePlugin[Vue/Nuxt Plugin]
    end

    DOM --> Binding
    Binding --> Engine
    NuxtDocs --> Engine
    VuePlugin --> Engine
    Engine --> Catalog
    Engine --> WebAudio
```

<!-- diagram:component:engine -->
## Core Engine Components

```mermaid
graph TD
    subgraph Entry
        Index[index.ts]
        Bind[bind.ts]
    end

    subgraph Core Instance
        Instance[instance.ts]
        Engine[engine.ts]
    end

    subgraph Synthesis
        Catalog[catalog.ts]
        LoopRuntime[loopRuntime.ts]
    end

    subgraph Primitives
        Builtins[synth/builtins.ts]
        Loops[synth/loops.ts]
        SynthPrimitives[synth/primitives.ts]
    end

    Index --> Bind
    Index --> Instance
    Bind --> Instance
    Instance --> Engine
    Instance --> Catalog
    Instance --> LoopRuntime
    Catalog --> Builtins
    LoopRuntime --> Loops
    Builtins --> SynthPrimitives
    Loops --> SynthPrimitives
```

<!-- diagram:dataflow:synthesis -->
## Audio Synthesis Flow

```mermaid
graph LR
    Trigger([UI Event / Method Call]) --> API[playUISound]
    API --> Resolve[Resolve Sound & Feel]
    Resolve --> Ctx{Context Ready?}
    Ctx -->|No| Resume[Resume AudioCtx]
    Ctx -->|Yes| Build[Build Graph]
    Resume --> Build
    Build --> Nodes[Create Oscillator]
    Nodes --> Env[Apply Envelope]
    Env --> Master[Master Gain & Pan]
    Master --> Output([Destination Node])
```
