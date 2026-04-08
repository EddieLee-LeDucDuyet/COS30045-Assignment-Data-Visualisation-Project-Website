// ===========================
// Story Telling Module
// Dynamic narratives keyed by section, jurisdiction, year, method
// ===========================

// ─── Narrative database ───────────────────────────────────────────────────────

const TREND_STORIES = {
    NSW: {
        default: {
            headline: 'NSW: The Camera Revolution',
            body: 'New South Wales was the first state to deploy mobile phone detection cameras at scale. The effect was immediate and dramatic — fines surged from 25,463 in 2019 to 138,847 in 2020 overnight, a 445% jump. By 2023 NSW cameras alone issued over 200,000 fines, dwarfing every other jurisdiction\'s total enforcement output.'
        }
    },
    VIC: {
        default: {
            headline: 'Victoria: Steady Police, Cautious Camera Rollout',
            body: 'Victoria maintained the highest police-issued fine volumes nationally for most of the 2008–2019 era, peaking near 61,000 in 2012. Camera detection arrived later and more gradually than NSW, with 2023 showing a fragmented rollout across city and regional locations rather than a single overnight spike.'
        }
    },
    QLD: {
        default: {
            headline: 'Queensland: The Sharpest Drop in Police Enforcement',
            body: 'Queensland\'s police-issued fines fell from a high of 33,352 in 2009 to just 3,079 by 2023 — a 91% decline. Cameras arrived in 2021 and rapidly filled the gap, with 118,152 camera fines issued in 2022 alone. The data tells a clear story of deliberate substitution: fewer officers, more machines.'
        }
    },
    SA: {
        default: {
            headline: 'South Australia: Consistent but Declining Police Presence',
            body: 'South Australia peaked at 14,167 police fines in 2009 and has declined steadily since, reaching 4,583 by 2022. SA has been slower to adopt camera technology than eastern states, with detailed age-group data only emerging from 2023. The state\'s enforcement profile remains predominantly police-driven.'
        }
    },
    WA: {
        default: {
            headline: 'Western Australia: Camera Charges, Not Just Fines',
            body: 'WA stands out for a unique data signature: its camera detections in 2023–2024 record zero fines but significant charges and arrests — suggesting cameras feed into charge-based enforcement rather than on-the-spot fines. Police fines have remained relatively stable at 1,500–1,700 per year through 2023–2024.'
        }
    },
    TAS: {
        default: {
            headline: 'Tasmania: Small State, Big Charges Rate',
            body: 'Tasmania has the smallest raw fine volumes nationally but a notable charges-to-fines ratio. Police issued 656 fines to 26–39 year olds in 2023 but also laid 21 charges in the same group — a rate roughly 10× higher than NSW. Camera fines via mobile detection also appeared from 2023, adding a new enforcement layer.'
        }
    },
    ACT: {
        default: {
            headline: 'ACT: Late Adopter, Rapid Camera Expansion',
            body: 'The Australian Capital Territory had among the smallest enforcement volumes nationally until 2024, when camera fines exploded to over 26,000 — driven almost entirely by the 26–64 age bracket. Police fines continued their long decline from 2,407 in 2010 to just 187 in 2024. The ACT transition to camera-first enforcement is now essentially complete.'
        }
    },
    NT: {
        default: {
            headline: 'Northern Territory: Small but Unique',
            body: 'The NT records the smallest absolute fine volumes in the country, but has a distinctive profile: a meaningful arrests rate compared to fines (particularly for the 65+ group in 2023) and no camera detection at all. Enforcement remains entirely police-driven, reflecting both the territory\'s geography and policing model.'
        }
    }
};

const DEMOGRAPHIC_STORIES = {
    NSW: {
        2024: {
            headline: 'NSW 2024: Young City Drivers Dominate the Fine Sheet',
            body: 'In NSW\'s major cities, 17–25 year olds received 4,539 fines and 26–39 year olds 4,401 — together accounting for the lion\'s share of police detections. Camera enforcement adds a further 147,272 fines nationally without age breakdown. Regional areas tell a different story: Inner Regional NSW sees proportionally more charges relative to fines, suggesting police pursue criminal sanctions more aggressively outside Sydney.'
        },
        2023: {
            headline: 'NSW 2023: The Camera Swamps Everything',
            body: 'NSW\'s 202,757 camera fines in 2023 dwarf all police-issued fines across every age group combined. Among police detections, the 26–39 bracket leads with 4,184 fines in major cities alone, followed closely by 40–64 year olds at 3,035. Charges cluster heavily in regional areas, with Inner Regional NSW accounting for 22 of the 73 total charges recorded.'
        }
    },
    VIC: {
        2024: {
            headline: 'Victoria 2024: Cameras Sweep the Middle-Aged',
            body: 'Victoria\'s camera enforcement in 2024 hits the 40–64 age bracket hardest: 12,729 camera fines in major cities alone, versus 4,448 police fines for the same group. The 26–39 cohort follows closely with 10,193 camera fines. Inner Regional Victoria also shows strong camera presence, suggesting a geographically broad rollout compared to the camera-era patterns of NSW.'
        },
        2023: {
            headline: 'Victoria 2023: City Cameras vs Regional Police',
            body: 'Melbourne\'s camera network issued 15,807 fines in the aggregate 0–65+ bucket plus thousands more by age group, while police in major cities focused on the 26–64 bracket. Notably, Inner Regional Victoria shows some of the highest per-capita police fine rates outside the capital, with the 26–39 and 40–64 groups leading in both cameras and police enforcement.'
        }
    },
    QLD: {
        2024: {
            headline: 'Queensland 2024: The 40–64 Bracket Caught Most Often',
            body: 'Queensland\'s cameras in 2024 issued 28,641 fines to drivers aged 40–64 — the highest age-specific camera fine count of any state. The 26–39 group comes second at 27,876. Police-issued fines remain far lower (849 and 1,322 respectively), illustrating the 33:1 efficiency ratio cameras deliver in this state.'
        },
        2023: {
            headline: 'Queensland 2023: Camera System Maturing',
            body: 'With 77,213 aggregate camera fines in 2023 (down from 118,152 in 2022), Queensland\'s camera network appears to be stabilising after its initial high-detection rollout phase. Police enforcement continued its decade-long decline with just 3,079 fines — the lowest since records began — confirming cameras have largely displaced traditional enforcement.'
        }
    },
    SA: {
        2024: {
            headline: 'South Australia 2024: City-Centric and Police-Only',
            body: 'SA\'s 2024 data is entirely police-driven with no camera fines recorded. Major cities account for the bulk: 1,575 fines to 26–39 year olds and 1,280 to 40–64 year olds. Remote and Very Remote SA show very low volumes, consistent with sparse population and policing resources. SA remains the largest state yet to deploy camera enforcement at scale.'
        },
        2023: {
            headline: 'South Australia 2023: Middle-Age, Middle of the Pack',
            body: 'SA\'s 2023 profile shows the 26–39 cohort leading with 2,272 fines statewide, followed by 40–64 at 1,805. The 65+ group contributes 302 fines — a higher share than in camera-dominant states, possibly reflecting different driving behaviours. No camera fines appear in 2023, making SA a useful baseline for pure police enforcement patterns.'
        }
    },
    WA: {
        2024: {
            headline: 'Western Australia 2024: Cameras Charge, Police Fine',
            body: 'WA\'s camera data records zero fines but 203 charges in 2024 — a unique enforcement model where camera evidence leads to criminal charges rather than infringement notices. Police meanwhile issued 4,730 conventional fines. The 26–39 group accumulates the most charges (89) and the most police fines (1,655), making them WA\'s highest-risk demographic by both measures.'
        },
        2023: {
            headline: 'Western Australia 2023: Same Pattern, Slightly Fewer Charges',
            body: 'WA\'s 2023 camera data again shows charges (157) rather than fines, consistent with the state\'s charge-based enforcement model. Police fines totalled around 4,592 with the 26–39 and 40–64 groups leading. The 17–25 bracket had 34 camera charges in 2023 — the highest youth charge rate of any state using cameras.'
        }
    },
    TAS: {
        2024: {
            headline: 'Tasmania 2024: High Charge Rates Persist',
            body: 'Tasmania\'s 2024 enforcement shows 32 charges from 1,531 police fines — a charge rate nearly 10× the national average. Camera fines (1,284) match police fines closely, an unusual balance not seen in any larger state. The 26–39 group leads in both police fines (618) and charges (16), while the 65+ group surprisingly contributes 91 police fines.'
        },
        2023: {
            headline: 'Tasmania 2023: A State Embracing Both Methods',
            body: 'Tasmania is notable for deploying both police and camera enforcement roughly evenly across age groups in 2023. With 1,558 police fines and 870 camera fines plus 37 charges, it\'s one of the few states where camera adoption hasn\'t completely overshadowed traditional policing. The charges rate (2.4% of police fines) is the highest nationally.'
        }
    },
    ACT: {
        2024: {
            headline: 'ACT 2024: Camera Explosion in the Capital',
            body: 'The ACT\'s 2024 camera fines surged to over 26,700, concentrated in the 26–64 age bracket (10,788 fines to 26–39 year olds, 10,535 to 40–64). Police fines fell to just 187 total — the lowest of any jurisdiction. This dramatic shift suggests the ACT has fully transitioned to automated enforcement, with police now playing only a residual role.'
        },
        2023: {
            headline: 'ACT 2023: The Transition Year',
            body: 'ACT 2023 data shows 288 police fines split across age groups — a sharp drop from prior years — with no camera breakdown available. This transitional period likely reflects the lead-up to the camera infrastructure that produced the 2024 surge. The 26–39 group leads police enforcement with 110 fines.'
        }
    },
    NT: {
        2024: {
            headline: 'Northern Territory 2024: Arrests Stand Out',
            body: 'The NT recorded only 244 fines in 2024 — the lowest of any jurisdiction — but 9 arrests, giving it the highest arrests-per-fine rate nationally. The 40–64 group led both fines (78) and arrests (7), while the 26–39 cohort had the most fines (112). No cameras operate in the NT; enforcement is entirely by police.'
        },
        2023: {
            headline: 'Northern Territory 2023: A Different Kind of Enforcement',
            body: 'NT\'s 2023 data shows 205 fines, 5 arrests and 14 charges — modest in volume but notable for the arrests rate. The 65+ group unusually had 2 arrests from just 10 fines. The NT\'s policing model appears to prioritise criminal sanction over infringement notices, consistent with its unique legal and geographic context.'
        }
    }
};

const FINES_STORIES = {
    both: {
        fullRange: {
            headline: 'The Full Picture: 16 Years of Enforcement',
            body: 'From 2008 to 2024, Australia issued over 2.5 million mobile phone fines. The first decade was exclusively police-driven and slowly declining as enforcement resources were redirected. The second phase — triggered by NSW\'s camera rollout in 2020 — transformed the scale of enforcement entirely. By 2023, automated cameras issued more fines in a single year than police had managed in the entire pre-camera era.'
        },
        cameraEra: {
            headline: 'The Camera Era (2020–2024)',
            body: 'Since cameras arrived in 2020, national fine volumes have grown every year. Camera detections now represent over 75% of all fines issued nationally. Police volumes have continued their pre-existing decline, masking the scale of the shift — the total enforcement burden on Australian drivers has more than doubled since 2019.'
        },
        preCameraEra: {
            headline: 'The Pre-Camera Era (2008–2019)',
            body: 'Before automated detection, enforcement peaked around 2010 at roughly 171,000 national fines and then gradually declined as resources shifted. Victoria and NSW were the dominant enforcement states. The decline from 2012 onwards likely reflects both changing policing priorities and the limits of manual detection at scale.'
        }
    },
    Police: {
        default: {
            headline: 'Police-Only: A Decade of Decline',
            body: 'Filtering to police enforcement alone reveals a consistent national decline from approximately 156,000 fines in 2008 to around 28,000 in 2024. The peak years (2009–2012) reflect heightened enforcement campaigns across multiple states. Since 2016, police volumes have fallen in every jurisdiction — not replaced by cameras, but simply reduced — until cameras arrived and redefined what enforcement could look like.'
        }
    },
    Camera: {
        default: {
            headline: 'Camera-Only: From Zero to Dominant',
            body: 'Camera enforcement didn\'t exist until 2020, when NSW launched its mobile phone detection network. The growth curve is extraordinary: 138,847 fines in 2020, 178,296 in 2021, 313,828 in 2022, and over 364,000 in 2023. Each year adds new jurisdictions and locations. By 2024, cameras operate in NSW, QLD, VIC, TAS, ACT and WA — and the trajectory continues upward.'
        }
    }
};

const ENFORCEMENT_STORIES = {
    2020: {
        headline: '2020: The Camera Arrives',
        body: 'NSW deployed the world\'s first AI-powered mobile phone detection cameras at scale. In the first year, cameras issued 138,847 fines — nearly equal to the entire national police total. The police share of enforcement shrank from 100% to around 65% overnight. This single year marks the most significant shift in Australian traffic enforcement history.'
    },
    2021: {
        headline: '2021: Queensland Joins the Camera Network',
        body: 'QLD launched its own camera program in 2021, adding 14,574 camera fines to the national total. Police enforcement continued declining across all states. Nationally, cameras accounted for roughly 60% of all fines for the first time. The divergence between police and camera trajectories became structurally permanent.'
    },
    2022: {
        headline: '2022: The Camera Majority',
        body: 'By 2022 cameras issued 313,828 fines nationally — nearly 80% of all enforcement. NSW alone contributed 194,793 camera fines. QLD surged to 118,152. Police totals fell to their lowest level since records began. The Man vs Machine contest was effectively over; machines had won comprehensively.'
    },
    2023: {
        headline: '2023: Peak Camera, New Jurisdictions',
        body: 'National camera fines peaked in 2023 at over 364,000. TAS and VIC expanded their camera networks, while ACT prepared for its 2024 launch. Police enforcement fell to approximately 28,000 nationally — less than 8% of total fines. The camera era is now the defining feature of Australian mobile phone enforcement.'
    },
    2024: {
        headline: '2024: ACT Joins, Volumes Stabilise',
        body: 'The ACT launched full camera enforcement in 2024, contributing over 26,700 fines. NSW camera volumes moderated slightly (147,272) while QLD expanded to 72,313. Overall national volumes held broadly steady after the 2023 peak, suggesting the rapid expansion phase may be giving way to a more stable equilibrium of automated enforcement.'
    }
};

// ─── Renderer ────────────────────────────────────────────────────────────────

/**
 * Render a story panel into a target element.
 * @param {string} targetId   - ID of the container to inject into
 * @param {Object} story      - { headline, body } or null to clear
 */
export function renderStory(targetId, story) {
    const el = document.getElementById(targetId);
    if (!el) return;

    if (!story) {
        el.innerHTML = '';
        el.style.display = 'none';
        return;
    }

    el.style.display = 'block';
    el.innerHTML = `
        <div class="story-narrative-inner">
            <div class="story-narrative-icon">📖</div>
            <div>
                <h4 class="story-narrative-headline">${story.headline}</h4>
                <p class="story-narrative-body">${story.body}</p>
            </div>
        </div>
    `;
}

/**
 * Inject a story panel placeholder into a section if not already present.
 * @param {string} sectionId - The section element ID
 * @param {string} panelId   - The story panel element ID to create
 * @param {string} afterId   - Insert panel after this element ID
 */
export function ensureStoryPanel(sectionId, panelId, afterId) {
    if (document.getElementById(panelId)) return;

    const after = document.getElementById(afterId);
    if (!after) return;

    const panel = document.createElement('div');
    panel.id = panelId;
    panel.className = 'story-narrative-panel';
    panel.style.display = 'none';

    after.parentElement.insertBefore(panel, after.nextSibling);
}

// ─── Story selectors ─────────────────────────────────────────────────────────

export function getTrendStory(jurisdictions) {
    if (!jurisdictions || jurisdictions.length === 0) return null;
    if (jurisdictions.length === 1) {
        const jur = jurisdictions[0];
        return (TREND_STORIES[jur] && TREND_STORIES[jur].default) || null;
    }
    // Multi-jurisdiction: synthesise
    const hasNSW = jurisdictions.includes('NSW');
    const hasQLD = jurisdictions.includes('QLD');
    return {
        headline: 'Comparing ' + jurisdictions.join(', '),
        body: hasNSW
            ? 'NSW\'s camera introduction in 2020 makes it the dominant visual feature of this comparison. ' +
              (hasQLD ? 'Queensland shows a similar but delayed and lower-magnitude spike from 2021. ' : '') +
              'All other selected states show relatively flat or declining police-only trends, highlighting how camera deployment creates an enforcement discontinuity unlike anything in the pre-2020 data.'
            : 'The selected jurisdictions all rely predominantly on police enforcement. Compare the gradual decline across each — driven by shifting policing priorities — against the backdrop of camera states where automation has redefined enforcement scale entirely.'
    };
}

export function getDemographicStory(jurisdiction, year) {
    const jurStories = DEMOGRAPHIC_STORIES[jurisdiction];
    if (!jurStories) return null;
    return jurStories[year] || jurStories['default'] || null;
}

export function getFinesStory(activeMethods, visibleYears) {
    if (!visibleYears || visibleYears.length === 0) return null;

    const min = Math.min(...visibleYears);
    const max = Math.max(...visibleYears);
    const methodKey = activeMethods.length === 2 ? 'both'
        : activeMethods[0];

    if (methodKey !== 'both') {
        return FINES_STORIES[methodKey]?.default || null;
    }

    // Both methods — pick contextual narrative
    if (min <= 2008 && max >= 2024) return FINES_STORIES.both.fullRange;
    if (min >= 2020)               return FINES_STORIES.both.cameraEra;
    if (max <= 2019)               return FINES_STORIES.both.preCameraEra;
    return FINES_STORIES.both.fullRange;
}

export function getEnforcementStory(maxYear) {
    return ENFORCEMENT_STORIES[maxYear] || ENFORCEMENT_STORIES[2024];
}