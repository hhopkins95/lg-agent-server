strategy :

- server is launched with some number of assistants, and usually a default
  config
- each assistant will have a config that can be updated
  - If using some persistent storage, the configs for each of these assistants
    will not override current ones (means they have likely been updated by the
    user), unless a '--refresh-configs' flag is passed
- thread files will store their most recent state.
  - info like status can be held in memory
- the latest runs for the state will be held in memory, but don't need to be
  persisted for now (at least in the file system). Since each run's state will
  grow with each successive run, data used to track all of the runs will grow
  exponentially and usually not be needed anyways since it is encompassed within
  the current state of the thread. Future improvement could track all of the
  diffs between runs for better tracking

- ^^ probably use a SQLlite checkpointer / mongo in prod

  in the file system storage I think we can title each file by it's name rather
  than id. -- easier to navigate

  File structure for file storage :

  {passed_data_dir}
  - graph_server
    - assistants
      - [assistant_name] (ie **DEFAULT**.json)
    - threads
      - [thread_id.json]
