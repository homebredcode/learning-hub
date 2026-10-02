# Ground and voltage drop

## Voltage needs two points

Voltage is a **difference** between two places. "12 V" on its own means nothing, you have to say 12 V compared with what. **Ground** is the point we agree to call 0 V so every other reading has something to compare against.

- **Earth ground** is a real connection to the earth through a metal stake. It is a safety path and a common reference.
- In a low-voltage system, "ground" usually just means the shared 0 V return wire.

## Ground leaks

Sometimes current escapes to ground before it completes the circuit it was meant for. The pressure sags at the leak, and the device downstream gets less than it should.

> If a device sees less voltage than the supply provides, something between them is using it up: wire resistance, a leak, or a connector.

## Voltage drop in wire

Wire has resistance. Current through it drops voltage, using the same Ohm's Law as before, **V = I × R**.

- Thicker wire means lower resistance and less loss.
- Longer wire means more resistance and more loss.
- More current means more loss.

A 200 mA device on 3 m of wire loses very little. A hungry device on thin wire loses a lot. Damaged equipment that draws extra current makes the sag worse.

## A rule of thumb

Around **10 % sag** is where trouble starts, but always check the device's own minimum operating voltage. A supply labelled 24 V may read slightly higher with no load, and a battery reads lower once it is working.

## Check yourself

?? What does it mean to say a point is "at 12 V"? || It is 12 V higher than the chosen reference point, ground. Voltage is always a difference between two points.

?? A device measures 10.5 V but the supply reads 12 V. What are the possible causes? || Voltage is being lost between them: thin or long wire, a bad connector, a ground leak, or the device drawing more current than expected.

?? Why does thicker wire reduce voltage drop? || It has lower resistance, so the same current uses less voltage getting through it (V = I × R).
