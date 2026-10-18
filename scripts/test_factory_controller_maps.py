#!/usr/bin/env python3
"""Focused factory adapter contracts using authored XML, not vendor fixtures."""
import unittest
from import_factory_controller_maps import parse_factory, profile_digest


class FactoryAdapterTest(unittest.TestCase):
    def parse(self, body):
        return parse_factory(('<root creation_date="test"><native_pro_device name="Authored"/>'+body+'</root>').encode(), 'midi/authored.xml')

    def test_explicit_button_and_condition_not_flattened(self):
        control = '<control channel="2" control="7" event_type="Note On"><userio event="click"><play deck_id="0"><translation action_on="press" behaviour="toggle"/></play></userio></control>'
        p = self.parse('<midi app="test">'+control+'<control><case><condition><modifier/></condition>'+control+'</case></control></midi><hid><control id="retained"/></hid>')
        self.assertEqual([m['target'] for m in p['mappings']], ['Deck 1 play'])
        self.assertEqual(len(p['controls']), 3)
        self.assertEqual(p['sourceEnvelope']['children'][1]['profileControlsRange'], [0, 2])
        self.assertEqual(p['sourceEnvelope']['children'][2]['profileControlsRange'], [2, 1])
        self.assertFalse(p['fullyTranslated'])

    def test_range_and_pair_not_guessed(self):
        control = '<control channel="3" control="8" complement_control="40" data_type="Absolute 14" event_type="Control Change"><userio event="click"><pitch_slider deck_id="1"><translation><range in_min="0" in_max="16383" out_min="1" out_max="0"/></translation></pitch_slider></userio></control>'
        p = self.parse('<midi>'+control+'</midi>')
        self.assertTrue(p['mappings'][0]['invert'])
        for invalid in [control.replace('40', '41'), control.replace('16383', '8191')]:
            self.assertEqual(self.parse('<midi>'+invalid+'</midi>')['mappings'], [])

    def test_compound_partial_action_is_reported_and_entities_rejected(self):
        p = self.parse('<midi><control channel="1" control="7" event_type="Note On"><userio event="click"><play deck_id="0"/><modifier/></userio></control></midi>')
        self.assertEqual([m['target'] for m in p['mappings']], ['Deck 1 play'])
        self.assertTrue(any(i.get('action') == 'modifier' for i in p['issues']))
        with self.assertRaises(ValueError): parse_factory(b'<!DOCTYPE root><root/>', 'test.xml')
        before = profile_digest(p); p['controls'][0]['attributes']['control'] = '8'
        self.assertNotEqual(before, profile_digest(p))

    def test_app_branch_and_modifier_remain_distinct(self):
        p = self.parse('<midi><control channel="7" control="0" event_type="Note On"><case><condition><current_active_app cmp_value="Serato DJ Lite" operator="not equal"/><modifier_1 cmp_value="on"/></condition><userio event="click"><grid_control_pad deck_id="0" slot_id="0"/></userio></case><case><condition><current_active_app cmp_value="Serato DJ Lite"/></condition><userio event="click"><play deck_id="0"/></userio></case></control></midi>')
        self.assertEqual([m['target'] for m in p['mappings']], ['Deck 1 active pad 1'])
        self.assertEqual(p['mappings'][0]['conditions'], [dict(kind='modifier', number=1, deck=0, equals=True)])
        self.assertEqual(p['mappings'][0]['sourceCaseIndex'], 0)

    def test_cc_modifier_is_retained_without_note_adapter(self):
        p = self.parse('<midi><control channel="1" control="7" event_type="Control Change"><userio event="click"><modifier_1><translation behaviour="explicit"/></modifier_1></userio></control></midi>')
        self.assertEqual(p['mappings'], [])
        self.assertTrue(any('requires Note' in i['reason'] for i in p['issues']))

    def test_master_percent_and_specific_fx_policy(self):
        p = self.parse('<midi><control channel="1" control="3" complement_control="35" data_type="Absolute 14" event_type="Control Change"><userio event="click"><master_volume/></userio></control><control channel="2" control="6" event_type="Control Change"><userio event="click"><effect_level_1_slot_parameter_1 deck_id="0" slot_id="1"/></userio></control></midi>')
        self.assertEqual([m['target'] for m in p['mappings']], ['Master volume'])
        self.assertTrue(any('device-specific' in i['reason'] for i in p['issues']))


if __name__ == '__main__': unittest.main()
