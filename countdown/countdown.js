/**
 * Copyright jbardi
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

function calcDuration(dur, units) {
  if (dur <= 0) {
    return 0;
  }
  switch (units.toLowerCase()) {
    case "second":
      return dur * 1000;
    case "minute":
      return dur * 1000 * 60;
    case "hour":
      return dur * 1000 * 60 * 60;
    default:
      throw new Error("unknown unit " + units);
  }
}

module.exports = function (RED) {
  "use strict";
  function countdown(n) {
    RED.nodes.createNode(this, n);
    const nodeContext = this.context();
    this.units = n.units || "Second";
    this.durationType = n.durationType;
    this.duration =
      parseInt(
        RED.util.evaluateNodeProperty(
          n.duration,
          this.durationType,
          this,
          null
        ),
        10
      ) || 5;

    const duration = calcDuration(this.duration, this.units);
    const interval = calcDuration(this.duration / 100, this.units);

    let currentJob = null;
    let startTimeOverride = 0;
    this.on("input", (msg, send, done) => {
      console.log("input", msg);
      try {
        currentJob?.destroy();
        nodeContext.set("lastMsg", msg);
        nodeContext.set("startTime", startTimeOverride || Date.now());
        startTimeOverride = 0;
        const job = {
          timeout: null,
          destroy: (e) => {
            try {
              job.timeout && clearTimeout(job.timeout);
              if (currentJob === job) {
                nodeContext.set("lastMsg", undefined);
                nodeContext.set("startTime", undefined);
              }
              this.status({});
            } finally {
              done?.(e);
            }
          },
        };
        currentJob = job;
        const tick = () => {
          try {
            const startTime = nodeContext.get("startTime") || 0;
            const countdown = 1 - (Date.now() - startTime) / duration;
            if (countdown <= 0) {
              const statusMessage = RED.util.cloneMessage(msg);
              statusMessage.payload = 0;
              send([msg, statusMessage]);
              currentJob?.destroy();
            } else {
              const statusMessage = RED.util.cloneMessage(msg);
              statusMessage.payload = countdown;
              send([null, statusMessage]);
              this.status({
                fill: "blue",
                shape: "dot",
                text: `${Math.round(countdown * 100)}%`,
              });
              job.timeout = setTimeout(tick, interval);
            }
          } catch (e) {
            currentJob?.destroy(e);
          }
        };
        job.timeout = setTimeout(tick, interval);
        this.status({ fill: "blue", shape: "dot", text: "0%" });
      } catch (e) {
        currentJob?.destroy(e);
      }
    });
    const lastMsg = nodeContext.get("lastMsg");
    if (lastMsg) {
      console.log("lastMsg!!", lastMsg);
      startTimeOverride = nodeContext.get("startTime");
      this.receive(lastMsg);
    }
  }
  RED.nodes.registerType("countdown", countdown);
};
