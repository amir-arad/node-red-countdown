## Countdown for node-red

_forked from node-red-contrib-stoptimer3_

Delays a message passing through the node. Much like the built in delay node, but supports none delayed message at a time, and reports progress.

Sends the `msg` through the first output after the set timer duration. If a new `msg` is received before the timer has ended, it will replace the existing `msg` and the timer will be restarted.

In the second output, it reports the countdown of the timer in percentages, starting with `1` and ending with `0`.

This node keeps its state in the node context and supports recovery. so if the default context is `localfilesystem` or another persisted context, the node will resumes seamlessly after re-deploys and restarts.
