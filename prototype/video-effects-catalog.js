import {currentVideoEffects,videoMenuEvidence} from './video-reference-menu.js';
// Factual names/categories only from local research; all algorithms and defaults are original.
export const videoEffectCatalog = [
  {
    "id": 0,
    "name": "Filter",
    "category": "Analyzer",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Spatial low/high/band-pass using original five-point neighbourhoods; no hardware/analyzer filter binding is inferred.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "mode": "Low Pass",
        "radius": 3
      }
    }
  },
  {
    "id": 1,
    "name": "Delay Grid",
    "category": "Delay",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Tiles retained upstream input frames by actual timestamp;16 history samples cover2seconds by default at bounded history resolution.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "historySeconds": 2,
        "delaySeconds": 0.125,
        "columns": 4
      }
    }
  },
  {
    "id": 2,
    "name": "Frame Freeze",
    "category": "Delay",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Capture the first enabled nonzero-amount input frame; keep it across amount changes until captureToken changes, bypass/re-enable, asset change or reset.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 1,
      "params": {
        "captureToken": 0
      }
    }
  },
  {
    "id": 3,
    "name": "Frame Pulse",
    "category": "Delay",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Live video with a raised-cosine border-alpha pulse; the center remains live and unchanged. Default period1second and edgeWidth.12 are independent choices. Explicit legacy periodBeats remains a BPM timing alternative. Reduced Motion is exact live bypass; no frame capture.",
    "manualMeaningEvidence": {"source":"local-evidence/claude-fable/official-video-manual-141226.pdf","page":20,"meaning":"Periodic pulsing at video-frame edges.","edition":"2015-04-09 PDF metadata; installed4.0.10 behavior unverified","exactResponseRecovered":false},
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "periodSeconds": 1,
        "edgeWidth": 0.12
      }
    }
  },
  {
    "id": 4,
    "name": "Isolator Bass",
    "category": "Colour",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Bass amplitude attenuates green/blue to isolate a warm colour response; silence leaves input unchanged.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 5,
    "name": "Flash On BPM",
    "category": "BPM Sync",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Beat-clock white flash with a declared duty; amount controls flash strength. Reduced motion disables generated flashes.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "periodBeats": 1,
        "duty": 0.15
      }
    }
  },
  {
    "id": 6,
    "name": "Split",
    "category": "Split",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Default five repeated vertical source regions, alternating vertical offset. Five regions follows the historical manual meaning; vertical arrangement, offsets, blending and optional2..12-panel extension are independently designed.",
    "manualMeaningEvidence": {"source":"local-evidence/claude-fable/official-video-manual-141226.pdf","page":20,"meaning":"Divide video into five areas.","edition":"2015-04-09 PDF metadata; installed4.0.10 behavior unverified","exactResponseRecovered":false},
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "panels": 5
      }
    }
  },
  {
    "id": 7,
    "name": "Audio Split",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Audio level creates repeated horizontal source bands with alternating horizontal displacement; silence is unchanged.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 8,
    "name": "Audio Fade",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Audio level controls source alpha; full amount is transparent at silence and preserves alpha at level1.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 9,
    "name": "Analyzer Blocks",
    "category": "Analyzer",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Overlay three segmented amplitude columns for bass/mid/treble. These are supplied band levels, not a claimed FFT.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 10,
    "name": "Analyzer Image",
    "category": "Analyzer",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Clip three image columns to heights supplied by bass/mid/treble; amount blends their alpha mask.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 11,
    "name": "Record Rotate",
    "category": "Record",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Integrate signed context.rate to rotate the image; context.position overrides integration. Stopped rate holds angle; reduced motion disables rotation.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "turnsPerSecond": 0.25
      }
    }
  },
  {
    "id": 12,
    "name": "Center Fade",
    "category": "Record",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Radial alpha vignette with brightness/extent scaled by absolute transport rate; complement behaviour is an independent design.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 13,
    "name": "Record Fade",
    "category": "Record",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Absolute transport rate controls source alpha; stopped rate fades out, equal forward/reverse magnitudes match.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 14,
    "name": "Bass Blur",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Original nine-point Gaussian spatial blur radius follows bass amplitude only.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 15,
    "name": "Bass Zoom",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Centered image zoom follows bass amplitude only.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 16,
    "name": "Treble Blur",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Original nine-point Gaussian spatial blur radius follows treble amplitude only.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 17,
    "name": "Treble Zoom",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Centered image zoom follows treble amplitude only.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 18,
    "name": "RGB Eq",
    "category": "TTM 57SL Controls",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Independent manual red/green/blue gain in normalized display RGB. TTM57SL mapping is unknown.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "red": 1.3,
        "green": 1,
        "blue": 0.7
      }
    }
  },
  {
    "id": 19,
    "name": "Audio RGB",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Bass/mid/treble independently raise red/green/blue gain; silence preserves input.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 20,
    "name": "CSL Eq",
    "category": "TTM 57SL Controls",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Independent hue rotation, chroma scaling and luminance offset; no vendor colour-space or hardware control mapping is inferred.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "hue": 45,
        "saturation": 1.25,
        "luminance": 0.04
      }
    }
  },
  {
    "id": 21,
    "name": "Audio CSL",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Bass rotates hue, mid raises chroma and treble raises luminance; silence preserves input.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 22,
    "name": "Brightness",
    "category": "Upfader",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Upfader-centred additive display-RGB brightness, clamped to0..1; exact reference upfader response is unknown.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "exposure": 1
      }
    }
  },
  {
    "id": 23,
    "name": "Smudge",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Manual Meaning: nine equal premultiplied spatial samples pull edge content inward along aspect-correct center rays, with independently chosen radius/edge mask. Earlier Open Play: original angle-directed weighted smear. Neither retains video frames.",
    "manualMeaningEvidence": {"source":"local-evidence/claude-fable/official-video-manual-141226.pdf","page":20,"meaning":"Blend image edges toward center.","edition":"2015-04-09 PDF metadata; installed4.0.10 behavior unverified","exactResponseRecovered":false},
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "behavior": "Manual Meaning",
        "radiusPixels": 24,
        "edgeWidth": 0.25,
        "angle": 0
      }
    }
  },
  {
    "id": 24,
    "name": "Mirror",
    "category": "Split",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Reflect the left half into the right, upper half into lower, or both, using the independently chosen axis.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "axis": "Horizontal"
      }
    }
  },
  {
    "id": 25,
    "name": "Kaleidoscope",
    "category": "Split",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Aspect-correct reflected polar sectors sample source image; sector count is original.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "sectors": 6,
        "angle": 0
      }
    }
  },
  {
    "id": 26,
    "name": "Audio Kaleidoscope",
    "category": "Audio Reactive",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Audio-level-weighted reflected sectors with mid-driven sector count and bass angular displacement; silence is unchanged.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 27,
    "name": "Saturation",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Scale chroma around Rec709-weighted display-RGB luma; fresh target2 increases color intensity. Explicit targets below1 retain independent desaturation, including saved0. Display-RGB curve, range and default are independently chosen.",
    "manualMeaningEvidence": {"source":"local-evidence/claude-fable/official-video-manual-141226.pdf","page":20,"meaning":"Increase existing color intensity proportionally.","edition":"2015-04-09 PDF metadata; installed4.0.10 behavior unverified","exactResponseRecovered":false},
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "saturation": 2
      }
    }
  },
  {
    "id": 28,
    "name": "Contrast",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Scale RGB contrast around an independent0.5 pivot with hard clipping.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 29,
    "name": "Gamma",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Manual Meaning: darken shadows using independent shadowPower1..4, interpolating exponent from1 by amount; black/white/alpha stay fixed. Earlier Open Play: preserve the original reciprocal gamma exponent and gamma.1..8. No vendor gamma curve is claimed.",
    "manualMeaningEvidence": {"source":"local-evidence/claude-fable/official-video-manual-141226.pdf","page":20,"meaning":"Darken shadow tones.","edition":"2015-04-09 PDF metadata; installed4.0.10 behavior unverified","exactResponseRecovered":false},
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "behavior": "Manual Meaning",
        "shadowPower": 2,
        "gamma": 3
      }
    }
  },
  {
    "id": 30,
    "name": "Color Isolator",
    "category": "Colour",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Preserve a chosen hue interval while making other hues grayscale; hue/width/softness are original.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "hue": 0,
        "width": 0.08,
        "softness": 0.08
      }
    }
  },
  {
    "id": 31,
    "name": "UV Paint",
    "category": "Colour",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Manual Meaning: display-RGB HSV colorfulness gate gives eligible hues full saturation/brightness and makes ineligible RGB black while preserving alpha. Independent threshold/softness/HSV response. Earlier Open Play retains the original neon tint/cyan edge glow.",
    "manualMeaningEvidence": {"source":"local-evidence/claude-fable/official-video-manual-141226.pdf","page":20,"meaning":"Brighten and saturate moderately colorful pixels; other pixels black.","edition":"2015-04-09 PDF metadata; installed4.0.10 behavior unverified","exactResponseRecovered":false},
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "behavior": "Manual Meaning",
        "colorThreshold": 0.2,
        "softness": 0.05
      }
    }
  },
  {
    "id": 32,
    "name": "Anaglyph 3D",
    "category": "Colour",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Oppositely displaced red and cyan channels; independent separation in output pixels.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "pixels": 12
      }
    }
  },
  {
    "id": 33,
    "name": "Luma Key Black",
    "category": "Alpha Based",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Remove pixels below a display-RGB luma threshold. Output alpha or composite over optional secondarySource with straight-alpha over.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "softness": 0.04
      }
    }
  },
  {
    "id": 34,
    "name": "Luma Key White",
    "category": "Alpha Based",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Remove pixels above an independent luma threshold. Output alpha or composite over secondarySource.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "softness": 0.04
      }
    }
  },
  {
    "id": 35,
    "name": "Chroma Key Green",
    "category": "Alpha Based",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Remove green-dominant pixels with independent threshold/softness/spill suppression; preserve other hues.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "softness": 0.04,
        "spill": 0.5
      }
    }
  },
  {
    "id": 36,
    "name": "Color Photocopy",
    "category": "Multisample",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Threshold individual colour channels into a hard printed palette and darken detected edges.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 37,
    "name": "Emboss",
    "category": "Multisample",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Diagonal source difference produces a grey-pivot relief image; independent kernel/direction.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 38,
    "name": "Sharpen",
    "category": "Multisample",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Add the difference between the source and nine-point blur, clamping final display RGB.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 39,
    "name": "Blur",
    "category": "Multisample",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Nine-point Gaussian blur with amount-controlled radius in output pixels.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 40,
    "name": "Edge Detect",
    "category": "Multisample",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Luminance finite-difference edge map with a black background and preserved source alpha.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 41,
    "name": "LED Billboard",
    "category": "Multisample",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Sample a colour at each cell centre and display it through an antialiased circular LED aperture.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 42,
    "name": "V-Hold",
    "category": "Time Based",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Wrap source vertically with generated sinusoidal drift and row jitter. Reduced motion disables the generated displacement.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 43,
    "name": "Posterize",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Round each display-RGB channel to2..16 independently chosen levels.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 44,
    "name": "Negative",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Invert display-RGB channels, blending by amount and preserving alpha.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 45,
    "name": "Sepia",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Original warm monochrome colour matrix, blended by amount.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 46,
    "name": "Rotoscope",
    "category": "Image",
    "sourceStatus": "OBSERVED_LOCAL_RESOURCE",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": false,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "manifest declaration; active menu unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Blur colour fields before quantization and darken their luminance edges; original painterly poster style.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 47,
    "name": "Rotate",
    "category": "Transform",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Static aspect-correct rotation with transparent outside pixels; angle in independently chosen degrees.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "angle": 90
      }
    }
  },
  {
    "id": 48,
    "name": "Zoom",
    "category": "Transform",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Scale around an independent centre point; amount interpolates from1x to target scale.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "scale": 4,
        "centerX": 0.5,
        "centerY": 0.5
      }
    }
  },
  {
    "id": 49,
    "name": "Tile",
    "category": "Transform",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Repeat complete source images in an independently chosen integer grid.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {
        "tiles": 5
      }
    }
  },
  {
    "id": 50,
    "name": "Zoom/Tile",
    "category": "Transform",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Continuously vary source scale through repeated wrapped tiles, combining fractional zoom and tiling.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 51,
    "name": "False Color",
    "category": "Colour",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Map display luma through an original blue/green/red heat palette.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 52,
    "name": "Analyzer",
    "category": "Analyzer",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Three solid supplied-band amplitude bars on black, blended with the source.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 53,
    "name": "Analyzer Line",
    "category": "Analyzer",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Interpolate supplied bass/mid/treble amplitudes into a visible spectrum-style line; no inferred FFT or vendor bins.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  },
  {
    "id": 54,
    "name": "Block Columns",
    "category": "Split",
    "sourceStatus": "OBSERVED_LOCALIZATION_LABEL",
    "sourceEvidence": "docs/research/video-catalog-evaluation.json",
    "candidateOnly": true,
    "openPlayAvailable": true,
    "referenceRuntimeVerified": false,
    "referenceAvailability": "localization candidate; registration unverified",
    "implementationStatus": "original-independent-WebGL2",
    "contract": "Three source-image columns follow independently integrated damped springs driven by bass/mid/treble.",
    "parameterStatus": "independent ranges/defaults; vendor parameter labels, mappings and ranges unknown",
    "default": {
      "on": false,
      "value": 0.65,
      "params": {}
    }
  }
];
export const videoEffectByName = new Map(videoEffectCatalog.map(effect => [effect.name, effect]));
// Every bound here is independently chosen, not a recovered reference knob range.
const parameterBounds = {
  behavior:{options:["Manual Meaning","Earlier Open Play"],unit:"Historical meaning with independent response, or preserve earlier Open Play rendering"},
  shadowPower:{min:1,max:4,unit:"Manual Meaning only; display-RGB shadow exponent"},radiusPixels:{min:0,max:96,unit:"Manual Meaning only; inward smear distance in output pixels"},colorThreshold:{min:0,max:1,unit:"Manual Meaning only; HSV colorfulness threshold"},
  mode:{options:["Low Pass","High Pass","Band Pass"]},radius:{min:.1,max:24,unit:"output pixels"},
  historySeconds:{min:.25,max:4,unit:"seconds"},delaySeconds:{min:.015625,max:4,unit:"seconds per tile age; unavailable past uses oldest actual retained frame"},columns:{min:2,max:8,step:1},
  captureToken:{kind:"caller-controlled capture identity"},periodBeats:{min:.125,max:16,unit:"beats"},periodSeconds:{min:.1,max:16,unit:"seconds; independent pulse duration"},edgeWidth:{min:.005,max:.45,unit:"normalized distance from nearest image edge"},duty:{min:.02,max:.95},panels:{min:2,max:12,step:1},
  turnsPerSecond:{min:-4,max:4},red:{min:0,max:3},green:{min:0,max:3},blue:{min:0,max:3},hue:{min:-360,max:360,unit:"degrees; Color Isolator uses0..360"},
  saturation:{min:0,max:3},luminance:{min:-1,max:1},exposure:{min:0,max:2},angle:{min:-360,max:360,unit:"degrees"},axis:{options:["Horizontal","Vertical","Both"]},sectors:{min:2,max:24,step:1},
  gamma:{min:.1,max:8,unit:"Earlier Open Play only; original reciprocal exponent"},width:{min:.001,max:.5,unit:"hue turns"},softness:{min:.001,max:.25,unit:"normalized threshold; Color Isolator allows.5"},pixels:{min:0,max:64},spill:{min:0,max:1},
  scale:{min:.25,max:8},centerX:{min:0,max:1},centerY:{min:0,max:1},tiles:{min:2,max:12,step:1},
};
for (const effect of videoEffectCatalog) {
  effect.independentParameters = [{name:"value",default:effect.default.value,min:0,max:1,
    status:"independent amount;0 is exact bypass"}, ...Object.entries(effect.default.params).map(([name,value])=>({name,default:value,...parameterBounds[name],status:"independently designed"}))];
  if(effect.name === "Color Isolator")for(const parameter of effect.independentParameters){if(parameter.name === "hue")parameter.min=0;if(parameter.name === "softness")parameter.max=.5;}
  if(effect.name === "Smudge")for(const parameter of effect.independentParameters){if(parameter.name === "angle")parameter.unit="Earlier Open Play only; original direction in degrees";if(parameter.name === "edgeWidth")parameter.min=.01;}
  if(effect.name === "Frame Pulse")effect.legacyParameters=[{name:"periodBeats",min:.125,max:16,unit:"beats",status:"Independent compatibility timing only when periodSeconds is absent; no frame-hold semantics."}];
  effect.historyPolicy = ["Frame Freeze","Delay Grid"].includes(effect.name)
    ? "Per-slot upstream-frame state survives parameter changes; asset/effect/off/reset or backward time clears it. Temporal storage is bounded."
    : "Per-slot record/spring state survives parameter changes; no retained video frames allocated.";
  effect.colorPolicy = "Normalized display RGB; premultiplied internal filtering, straight-alpha colour operations/output; transparent outside image bounds. Not a vendor colour-space claim.";
}

// Preserve resource provenance/candidate flags as historical evidence. Current
// menu presence has its own narrower field; algorithms remain unverified.
for(const effect of videoEffectCatalog){
  const menu=currentVideoEffects[effect.name];
  effect.referenceMenuVisible=!!menu;
  effect.referenceMenuLabel=menu?.label??effect.name;
  effect.referenceMenuCategory=menu?.category??null;
  effect.referenceMenuEvidence=videoMenuEvidence;
  if(menu)effect.referenceAvailability='Observed installed4.0.10 menu on2026-10-17; parameter/rendering equivalence unverified';
}
