## Start with a real input

Open **Settings → MIDI → Mapping editor**. Select the intended MIDI input and output where available. Grant device access only for the controller you mean to use.

The app has real MIDI input, mapping/learn handling and message timestamps. Synthetic injection and connection/LED fixtures are separately labelled; their response does not prove a physical controller is connected or fully mapped.

## Learn a control

1. Stop playback or lower the master before experimenting.
2. Choose the target and mapping/learn action in the editor.
3. Move one physical control and inspect the received message and resulting target.
4. Confirm absolute/relative encoding and direction before saving.
5. Check that the intended deck/channel changes and another channel does not.

Different encoders send different data. A browser knob working once does not establish jog-wheel touch, pitch calibration, LED feedback or every pad bank.

## Hercules and audio routing

Historical private tests include specific Hercules DJControl Inpulse 300 MK2 interactions. The current full controller/headphone/master session is still pending. Do not read the Hardware panel’s descriptive device card as a live connection monitor.

MIDI mapping and audio routing are separate. A controller can send messages while master/cue outputs are configured incorrectly. Follow [Audio routing](/mixer/#configure-a-separate-output) and test quietly with the actual connected equipment.

## Unsupported assumptions

DVS timecode, CDJ HID, Phase, guide LEDs, firmware-specific behavior, hot-plug recovery and multi-controller arbitration need explicit native/device acceptance. External-control selectors and synthetic scopes are not proof of those integrations.

If a device disconnects, lower output and preserve your session. Record the device model, connection, mapping, channel and action before reconnecting or restarting. Keep existing controller firmware and mappings unless a deliberate supported change is intended.
