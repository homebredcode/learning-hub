# Ohm's Law, series and parallel

Think of a circuit as water in a closed loop of pipe. The electrons are already in the wire. A battery doesn't add any, it adds **pressure** to push the ones already there.

## The three ideas

- **Voltage (V)** is the pressure, the push.
- **Current (I)** is the flow rate: how many electrons pass a point each second, in amps.
- **Resistance (R)** is how much the path fights the flow, in ohms.

Current is *not* the electrons. It is how fast they move past you.

## Ohm's Law

> V = I × R

Same push, more resistance, less flow. Same resistance, more push, more flow. The "I" stands for *intensity*, an old physics convention.

## Series: one loop

Everything sits on one path, so **the same current flows through every part**. Add a second bulb and the total resistance goes up, so the current goes down and both bulbs get dimmer.

## Parallel: branches

The current splits into several paths. Each branch gets the **full voltage**, so each bulb is as bright as if it were alone. Adding a branch gives the current another lane, so total resistance goes **down** and total current goes **up**.

- Unscrew one bulb in parallel and the others don't change. This is why household wiring is parallel.
- The formula is `1/R_total = 1/R1 + 1/R2`, then invert. You are adding *conductances* (how easily each path lets current through), which is why it looks odd.

## Check yourself

?? You add a second bulb in series. What happens to the current and why? || Total resistance goes up, so with the same voltage the current goes down. Both bulbs dim.

?? You add a second bulb in parallel. What happens to the brightness of the first one? || Nothing. Each branch still gets the full voltage, so each bulb draws the same current as before.

?? Why does adding a parallel path lower the total resistance? || It is another lane for current. More lanes at the same pressure means more total flow, which is the same as lower resistance.

?? Why do we invert ohms in the parallel formula? || Parallel paths add their conductances (1/R). Inverting at the end turns that sum back into ohms.
