// ===========================
// Story Telling Module
// All narratives and data notes are scoped to MOBILE PHONE NON-COMPLIANCE FINES only.
// Notes sourced from: Police enforcement data dictionary, Release date: 27/05/2025
// ===========================

// ─── Data dictionary notes mobile phone fines only ─────────────────────────
// Sourced verbatim from the "Mobile phone non-compliance fines" field definition
// and the general limitations sections of the data dictionary.

// Per-jurisdiction notes relevant to mobile phone fines
const DATA_NOTES = {
  ACT: [
    '📋 <strong>ACT fines data:</strong> Some ACT camera fines (e.g. seatbelt offences) are collected by Access Canberra rather than ACT Police the two agencies report separately.',
    '📅 <strong>Missing data:</strong> 2022 ACT speeding camera data is not available. This may affect completeness of ACT camera records in that year.',
    '📌 <strong>Location field:</strong> For ACT, location reflects the remoteness area of the incident or the issuing officer\'s station, depending on the offence type.',
  ],
  NSW: [
    '🏛️ <strong>Two agencies:</strong> NSW Police Force collects police-issued fines. Camera fines are publicly available and collected by <strong>NSW Revenue</strong> a separate agency. Both are included in this dataset.',
    '⚠️ <strong>Data is subject to revision.</strong> NSW fine counts for 2023 used a proxy (sum of fines + charges) where raw count data was missing.',
    '🔢 <strong>Arrests not applicable:</strong> Arrests are generally not recorded for mobile phone fines in NSW. Blank values in the arrests column are expected.',
    '📅 <strong>2023 new fields:</strong> Age groups, remoteness area and detection method detail became available for NSW from 2023 prior years show only aggregate totals.',
  ],
  VIC: [
    '⚠️ <strong>2024 PIA impact:</strong> Victoria\'s 2024 mobile phone fine volumes were low because of <strong>Protected Industrial Action (PIA)</strong>. Treat 2024 Victorian totals with caution they do not reflect normal enforcement levels.',
    '📌 <strong>Location field:</strong> For Victoria, location reflects remoteness area where available. Inner Regional and Major Cities are the main categories reported.',
    '📅 <strong>2023 new fields:</strong> Age group and detection method detail became available for VIC from 2023.',
  ],
  QLD: [
    '📷 <strong>Camera review process:</strong> QLD camera detections are assessed by an accredited Traffic Camera Office staff member before an infringement notice is issued. <strong>Not all camera detections result in a fine.</strong>',
    '🏛️ <strong>Two agencies:</strong> Queensland Police Service collects police-issued fines. Camera fines are collected by the <strong>Department of Transport and Main Roads</strong>.',
    '📅 <strong>2023 new fields:</strong> Age group and detection method detail became available for QLD from 2023.',
  ],
  SA: [
    '⚠️ <strong>Data is subject to revision.</strong> SA fine counts for 2023 used a proxy (sum of fines + charges) where raw count data was missing.',
    '📅 <strong>2023 new fields:</strong> Age groups and remoteness area became available for SA from 2023 prior years show only aggregate totals.',
  ],
  WA: [
    '⚠️ <strong>Data is subject to revision.</strong> WA fine counts for 2023 used a proxy (sum of fines + charges) where raw count data was missing.',
    '📷 <strong>WA camera enforcement:</strong> WA detection modes include On-The-Spot (OTS), mobile camera, fixed camera, average speed camera and red-light camera. Camera detections may result in charges rather than infringement notices.',
    '📌 <strong>Location field:</strong> For WA, location reflects the remoteness area of the incident or the issuing officer\'s station depending on the offence.',
  ],
  TAS: [
    '📷 <strong>Camera rollout:</strong> Tasmania\'s mobile speed cameras were enhanced to detect mobile phone offences from <strong>August 2023</strong>. Camera data before this date is not available for TAS.',
    '🔢 <strong>Arrests not applicable:</strong> Arrests are generally not recorded for mobile phone fines in Tasmania. Blank values in the arrests column are expected.',
    '📅 <strong>2023 new fields:</strong> Age group and detection method detail became available for TAS from 2023.',
  ],
  NT: [
    '📌 <strong>No camera enforcement:</strong> The Northern Territory has no camera-based mobile phone detection. All enforcement is carried out by police officers.',
    '📅 <strong>2023 new fields:</strong> Age groups and detection method became available for NT from 2023 prior years show aggregate totals only.',
  ],
};

// Method-level notes relevant to mobile phone fines
const METHOD_NOTES = {
  Police: [
    '👮 <strong>Police fines</strong> are issued when an officer directly observes a driver using a mobile phone or portable device. The officer stops the vehicle and issues an infringement notice.',
    '📌 <strong>Arrests</strong> are generally not applicable for mobile phone fines in NSW and Tasmania blank values in those states are expected, not missing data.',
  ],
  Camera: [
    '📷 <strong>Camera fines</strong> are issued when an automated detection system captures an image of a driver using a mobile phone. The driver is not stopped the fine is mailed.',
    '⚠️ <strong>Not all states report camera fines through the same agency.</strong> NSW camera fines come from NSW Revenue; QLD camera fines from Dept. of Transport and Main Roads; some ACT camera fines from Access Canberra. All are included here.',
  ],
};

// General notes shown on national views (no single jurisdiction selected)
const NATIONAL_NOTES = [
  '📋 <strong>Mobile phone non-compliance fines</strong> = number of fines issued for using a mobile phone and/or portable device while driving. (Source: Police enforcement data dictionary, 27/05/2025)',
  '⚠️ <strong>Data coverage varies by state:</strong> Some agencies only collect part of enforcement data. Not all states make their data publicly available, making a complete national picture difficult.',
  '📅 <strong>From 2023</strong>, the data structure expanded to include age groups, remoteness area, detection method detail and monthly granularity where available. Prior years are aggregate only.',
  '🔄 <strong>Data is subject to revision.</strong> Some jurisdictions used proxy counts (sum of fines + charges) where raw count data was unavailable.',
];

// ─── Trend stories mobile phone fines ──────────────────────────────────────

const TREND_STORIES = {
  NSW: {
    default: {
      headline: 'NSW: The Camera Revolution in Mobile Phone Enforcement',
      body: 'New South Wales was the first state to deploy AI-powered mobile phone detection cameras at scale. Mobile phone fines surged from 25,463 in 2019 to 138,847 in 2020 a 445% jump the moment cameras went live. By 2023, NSW cameras alone issued over 200,000 mobile phone fines. Camera fines are collected by NSW Revenue, not NSW Police, and both agencies\' data are included here.',
    }
  },
  VIC: {
    default: {
      headline: 'Victoria: Steady Police Enforcement, Gradual Camera Rollout',
      body: 'Victoria maintained the highest police-issued mobile phone fine volumes nationally for most of the 2008–2019 era, peaking near 61,000 in 2012. Camera detection expanded gradually from 2023, with fines recorded across Major Cities and Inner Regional locations. Note: 2024 data volumes are lower than usual due to Protected Industrial Action (PIA) not a reduction in actual offending.',
    }
  },
  QLD: {
    default: {
      headline: 'Queensland: From Police-Led to Camera-Dominant',
      body: 'Queensland\'s police-issued mobile phone fines fell from 33,352 in 2009 to just 3,079 by 2023 a 91% decline. Camera enforcement, managed by the Department of Transport and Main Roads, arrived in 2021 and issued 118,152 fines in 2022 alone. Note: QLD camera detections are reviewed by Traffic Camera Office staff before a fine is issued not all detections result in fines.',
    }
  },
  SA: {
    default: {
      headline: 'South Australia: Police-Only Enforcement',
      body: 'South Australia relies entirely on police officers for mobile phone enforcement no camera fines have been recorded. Volumes peaked at 14,167 in 2009 and have declined since. Age group and location data only became available from 2023; prior years are aggregate totals only.',
    }
  },
  WA: {
    default: {
      headline: 'Western Australia: Stable Police Volumes, Unique Camera Model',
      body: 'WA police-issued mobile phone fines have remained relatively stable at around 3,500–4,700 per year. WA\'s camera enforcement is distinctive: detections feed into charges rather than infringement notices, so camera "fines" may appear as zero while charges are non-zero. Fine count proxies (sum of fines + charges) were used for 2023 where raw counts were missing.',
    }
  },
  TAS: {
    default: {
      headline: 'Tasmania: Camera Enforcement Arrives Mid-2023',
      body: 'Tasmania\'s mobile speed cameras were enhanced to detect mobile phone offences from August 2023, adding a new enforcement layer alongside police. Before August 2023, all Tasmanian mobile phone enforcement was police-issued. Arrests are generally not applicable for mobile phone fines in Tasmania blank arrest values are expected.',
    }
  },
  ACT: {
    default: {
      headline: 'ACT: Small Volumes, Rapid Camera Transition',
      body: 'The ACT had very low police enforcement volumes (under 2,500 fines per year) until camera fines exploded to over 26,000 in 2024. ACT camera fines are collected through Access Canberra and the Australian Federal Police two separate agencies. 2022 ACT camera data is not available.',
    }
  },
  NT: {
    default: {
      headline: 'Northern Territory: Police-Only, Small Volumes',
      body: 'The NT has no camera-based mobile phone enforcement. All fines are police-issued, and volumes are the smallest of any jurisdiction nationally. Age group and detection method detail became available for NT from 2023.',
    }
  },
};

// ─── Demographics stories mobile phone fines, jurisdiction × year × method ──

const DEMOGRAPHIC_STORIES = {
  NSW: {
    2024: {
      Police: {
        headline: 'NSW 2024 Police: 17–39 Year Olds Lead Mobile Phone Fines',
        body: 'NSW Police issued 4,539 fines to 17–25 year olds and 4,401 to 26–39 year olds in major cities together accounting for the majority of police mobile phone detections. Arrests are not applicable for NSW mobile phone fines. Age group data has been available since 2023; prior years are aggregate only.',
      },
      Camera: {
        headline: 'NSW 2024 Camera: 147K Fines, Aggregate Only',
        body: 'NSW Revenue\'s camera system issued 147,272 mobile phone fines in 2024, reported as a single 0-65+ aggregate individual age group breakdowns are not available for camera detections in NSW. Enable the "Show 0-65+ aggregate" toggle to view this total alongside the police age breakdown.',
      },
      Both: {
        headline: 'NSW 2024: Police Age Detail vs Camera Scale',
        body: 'Police enforcement captures who is caught in detail 17–25 and 26–39 year olds lead. Camera enforcement adds 147K fines but only in aggregate. This reflects a fundamental difference: NSW Revenue (cameras) reports differently to NSW Police Force, and the two agencies\' data structures don\'t align at the age-group level.',
      },
    },
    2023: {
      Police: {
        headline: 'NSW 2023 Police: 26–39 Age Group Most Fined',
        body: '26–39 year olds received 4,184 police mobile phone fines in NSW major cities in 2023, followed by 40–64 year olds at 3,035. Inner Regional NSW shows a higher charges-to-fines ratio police pursued more serious enforcement actions outside metro areas. 2023 was the first year age group data was available for NSW.',
      },
      Camera: {
        headline: 'NSW 2023 Camera: 202K Fines Highest Single-Year Figure',
        body: 'NSW camera mobile phone fines peaked at 202,757 in 2023 the highest of any jurisdiction in any year. All reported as a 0-65+ aggregate by NSW Revenue. Fine counts for 2023 used a proxy (sum of fines + charges) where raw count data was missing.',
      },
      Both: {
        headline: 'NSW 2023: Cameras Issue 97% of All Mobile Phone Fines',
        body: 'NSW camera fines (202,757) represent approximately 97% of total NSW mobile phone enforcement in 2023. Police detections, while providing age-group detail, contributed fewer than 6,000 fines. This gap defines how NSW mobile phone enforcement now operates: automated at scale, with police playing a residual role.',
      },
    },
  },
  VIC: {
    2024: {
      Police: {
        headline: 'Victoria 2024 Police: PIA Suppressed Volumes',
        body: 'Victoria\'s 2024 police mobile phone fine volumes were lower than usual due to Protected Industrial Action (PIA). Despite this, the 26–39 and 40–64 age groups account for most police detections across both metro and regional areas. Do not compare 2024 VIC police totals directly with other years.',
      },
      Camera: {
        headline: 'Victoria 2024 Camera: 40–64 Bracket Caught Most',
        body: 'Camera enforcement in Victoria\'s major cities issued 12,729 mobile phone fines to 40–64 year olds and 10,193 to 26–39 year olds. Note: PIA affected police volumes in 2024 but camera enforcement appears less impacted, making the camera-to-police ratio in 2024 higher than usual.',
      },
      Both: {
        headline: 'Victoria 2024: PIA Creates Unusual Police-Camera Gap',
        body: 'In 2024, Protected Industrial Action reduced police mobile phone fine volumes significantly while camera enforcement continued at normal levels. The resulting police-to-camera ratio is not representative of Victoria\'s typical enforcement profile use 2023 for a more normal comparison.',
      },
    },
    2023: {
      Police: {
        headline: 'Victoria 2023: City and Regional Police Enforcement',
        body: '2023 was the first year Victoria reported age group and detection method detail for mobile phone fines. Melbourne police focused on the 26–64 bracket, while Inner Regional Victoria shows police fine rates comparable to the capital. Location reflects remoteness area where available.',
      },
      Camera: {
        headline: 'Victoria 2023: Camera Network Expanding Across Locations',
        body: 'Victoria\'s 2023 camera mobile phone fines are recorded across Major Cities, Inner Regional and Outer Regional locations a broader geographic footprint than most states. Age-specific camera data is available for most age brackets from 2023.',
      },
      Both: {
        headline: 'Victoria 2023: Both Methods Active Across Age Groups',
        body: 'Unlike NSW where cameras completely dominate, Victoria in 2023 shows meaningful police volumes alongside camera detections particularly in regional areas. This reflects a more gradual camera rollout compared to NSW\'s overnight surge in 2020.',
      },
    },
  },
  QLD: {
    2024: {
      Police: {
        headline: 'Queensland 2024 Police: Enforcement at Historic Lows',
        body: 'QLD police mobile phone fines continued declining in 2024, with 26–39 year olds receiving the most (1,322) and 40–64 year olds next (849). Queensland Police Service and the Department of Transport and Main Roads report separately police fines and camera fines come from different agencies.',
      },
      Camera: {
        headline: 'Queensland 2024 Camera: 40–64 Bracket Fined Most',
        body: 'QLD camera mobile phone fines hit 28,641 for the 40–64 age group the highest age-specific camera fine count of any state. Note: QLD camera detections are assessed by Traffic Camera Office staff before a fine is issued, so not all detections become fines. Camera data is from the Department of Transport and Main Roads.',
      },
      Both: {
        headline: 'Queensland 2024: A 33:1 Camera-to-Police Ratio',
        body: 'For 40–64 year olds, QLD cameras issued 28,641 mobile phone fines versus just 849 from police a 33:1 ratio. This is among the highest camera efficiency ratios of any jurisdiction. QLD camera fines are managed by the Dept. of Transport and Main Roads; police fines by Queensland Police Service.',
      },
    },
    2023: {
      Police: {
        headline: 'Queensland 2023 Police: 3,079 Fines Lowest on Record',
        body: 'Queensland police mobile phone fines fell to 3,079 in 2023 their lowest recorded figure. The shift to camera-based enforcement is essentially complete. 2023 was the first year QLD provided age group and detection method detail.',
      },
      Camera: {
        headline: 'Queensland 2023 Camera: Stabilising After 2022 Peak',
        body: 'QLD camera mobile phone fines eased to 77,213 in 2023 from 118,152 in 2022, suggesting the initial rollout surge is stabilising. Detections from cameras are reviewed before fines are issued not all detections result in infringements.',
      },
      Both: {
        headline: 'Queensland 2023: Cameras Issue 96% of Mobile Phone Fines',
        body: 'Camera enforcement represents approximately 96% of all Queensland mobile phone fines in 2023. The transition from police to camera detection that began in 2021 is now structurally complete in QLD.',
      },
    },
  },
  SA: {
    2024: {
      Police: {
        headline: 'South Australia 2024: Police-Only, City-Concentrated',
        body: 'SA has no camera mobile phone enforcement. All 3,437 fines in 2024 were police-issued, concentrated in major cities: 1,575 to 26–39 year olds and 1,280 to 40–64 year olds. Remote and Very Remote SA show minimal volumes. Age group data has been available since 2023.',
      },
      Camera: {
        headline: 'South Australia: No Camera Mobile Phone Enforcement',
        body: 'South Australia does not operate camera-based mobile phone detection. All enforcement is carried out by SA Police Force officers. SA is the largest state yet to deploy camera mobile phone enforcement.',
      },
      Both: {
        headline: 'South Australia 2024: The Police-Only Baseline',
        body: 'SA\'s age distribution for mobile phone fines reflects purely who police officers observe and stop no camera automation. The 26–39 cohort leads, consistent with national patterns, but absolute volumes are far lower than camera-enabled states. SA fine counts for 2023 used proxy counts where raw data was missing.',
      },
    },
    2023: {
      Police: {
        headline: 'South Australia 2023: 5,769 Police Fines',
        body: '26–39 year olds led SA mobile phone fines in 2023 with 2,272 statewide, followed by 40–64 at 1,805. Note: SA fine counts for 2023 used a proxy (sum of fines + charges) where raw count data was missing. 2023 was the first year SA reported age group breakdown.',
      },
      Camera: {
        headline: 'South Australia 2023: No Camera Data',
        body: 'No camera mobile phone fines recorded for South Australia in 2023. All figures are police-issued.',
      },
      Both: {
        headline: 'South Australia 2023: Police-Only Enforcement',
        body: 'SA\'s 2023 total of 5,769 police mobile phone fines makes it one of the lower-volume jurisdictions nationally. Without cameras, SA provides a useful comparison for understanding pure police enforcement patterns.',
      },
    },
  },
  WA: {
    2024: {
      Police: {
        headline: 'Western Australia 2024: Stable Police Enforcement',
        body: 'WA Police Force issued 3,731 mobile phone fines in 2024. The 26–39 group led with 1,655 fines and 40–64 followed with 1,138. WA police enforcement has been relatively stable compared to the national trend of decline. Fine counts used a proxy for 2023 where raw data was missing.',
      },
      Camera: {
        headline: 'Western Australia 2024: Camera Detections Lead to Charges',
        body: 'WA camera enforcement records zero fines but 203 charges WA\'s legal framework routes camera detections to criminal charges rather than infringement notices. The 26–39 group accumulated the most charges (89). This is by design: WA camera "fines" will always appear as zero in this dataset.',
      },
      Both: {
        headline: 'Western Australia 2024: Two Different Enforcement Outcomes',
        body: 'WA runs two parallel systems: police issue infringement notices (3,731 fines) while cameras generate charges (203 charges, zero fines). The charges column is essential for understanding the full scope of WA camera enforcement the fines column alone is misleading for WA.',
      },
    },
    2023: {
      Police: {
        headline: 'Western Australia 2023: 4,592 Police Mobile Phone Fines',
        body: 'WA police issued 4,592 mobile phone fines in 2023, with 26–39 and 40–64 groups leading. Note: WA fine counts for 2023 used a proxy (sum of fines + charges) where raw count data was missing.',
      },
      Camera: {
        headline: 'Western Australia 2023: 157 Camera Charges, Zero Fines',
        body: 'WA cameras generated 157 charges in 2023, consistent with the charge-based enforcement model. Zero camera fines are expected for WA this is correct, not missing data.',
      },
      Both: {
        headline: 'Western Australia 2023: Read Charges, Not Just Fines',
        body: 'For a complete picture of WA mobile phone enforcement, the charges column must be read alongside fines. The 26–39 group had the most fines (1,512) and the most charges (66), making them the highest combined-risk group in WA.',
      },
    },
  },
  TAS: {
    2024: {
      Police: {
        headline: 'Tasmania 2024 Police: 1,531 Fines, 32 Charges',
        body: 'Tasmania\'s police issued 1,531 mobile phone fines and laid 32 charges in 2024. Note: arrests are generally not applicable for mobile phone fines in Tasmania blank arrest values are expected, not missing data. The 26–39 group led with 618 fines.',
      },
      Camera: {
        headline: 'Tasmania 2024 Camera: 1,284 Fines Since August 2023 Rollout',
        body: 'Tasmania\'s mobile speed cameras, enhanced to detect mobile phone offences from August 2023, issued 1,284 fines in 2024. Camera and police volumes are unusually balanced in TAS compared to larger states. The 26–39 group led camera detections with 502 fines.',
      },
      Both: {
        headline: 'Tasmania 2024: Balanced Camera and Police Mobile Phone Enforcement',
        body: 'Tasmania is one of the few states where camera and police mobile phone fines are roughly equal in volume a pattern not seen in NSW, QLD or VIC. This reflects both the recent camera rollout (from August 2023) and the continued strength of police enforcement. Arrests are not applicable for TAS mobile phone fines.',
      },
    },
    2023: {
      Police: {
        headline: 'Tasmania 2023 Police: 1,558 Fines, 37 Charges',
        body: 'Tasmania police issued 1,558 mobile phone fines and laid 37 charges in 2023. Arrests are not applicable for TAS mobile phone fines. 2023 was the first year TAS reported age group and detection method detail.',
      },
      Camera: {
        headline: 'Tasmania 2023 Camera: Rollout Began August 2023',
        body: 'Tasmania\'s mobile speed cameras were enhanced to detect mobile phone offences from August 2023. Camera fines (870) in 2023 only cover August–December a partial-year figure. Full-year camera data is available from 2024.',
      },
      Both: {
        headline: 'Tasmania 2023: The Arrival of Camera Enforcement',
        body: '2023 is Tasmania\'s transition year police enforcement continued at normal levels (1,558 fines) while camera enforcement started mid-year (870 fines, August–December only). The 26–39 group led both methods.',
      },
    },
  },
  ACT: {
    2024: {
      Police: {
        headline: 'ACT 2024 Police: 187 Fines Enforcement Almost Entirely Camera-Led',
        body: 'ACT Police issued just 187 mobile phone fines in 2024 the lowest of any jurisdiction. Some ACT camera fines are collected by Access Canberra rather than ACT Police, so the two agencies report separately. The ACT has effectively completed its transition to camera-based mobile phone enforcement.',
      },
      Camera: {
        headline: 'ACT 2024 Camera: Over 26,700 Mobile Phone Fines',
        body: 'ACT camera mobile phone fines surged to over 26,700 in 2024, concentrated in the 26–64 age bracket. Camera fines are collected through Access Canberra and the Australian Federal Police. Note: 2022 ACT camera data is not available.',
      },
      Both: {
        headline: 'ACT 2024: A 143:1 Camera-to-Police Ratio',
        body: 'The ACT\'s 2024 ratio of camera to police mobile phone fines (26,700 vs 187) is the highest of any jurisdiction. No other state has completed the shift to automated enforcement as thoroughly. The 26–64 age bracket drives virtually all enforcement activity.',
      },
    },
    2023: {
      Police: {
        headline: 'ACT 2023 Police: 288 Fines Declining Pre-Camera Surge',
        body: 'ACT Police issued 288 mobile phone fines in 2023. The 26–39 group led with 110. This transitional year preceded the 2024 camera surge. Some ACT camera fines are collected by Access Canberra rather than ACT Police.',
      },
      Camera: {
        headline: 'ACT 2023 Camera: Pre-Surge Year',
        body: 'The major ACT camera rollout occurred in 2024. Limited camera data is available for ACT in 2023. Note: 2022 ACT camera data is not available at all.',
      },
      Both: {
        headline: 'ACT 2023: The Year Before the Camera Explosion',
        body: 'ACT 2023 enforcement totalled just 288 police fines making the 2024 camera surge of 26,700+ fines one of the most dramatic single-year shifts in Australian mobile phone enforcement history.',
      },
    },
  },
  NT: {
    2024: {
      Police: {
        headline: 'Northern Territory 2024: Police-Only, 244 Fines',
        body: 'The NT has no camera mobile phone enforcement. All 244 fines in 2024 were issued by NT Police Force officers. The 26–39 group led with 112 fines, followed by 40–64 with 78. Age group data became available for NT from 2023.',
      },
      Camera: {
        headline: 'Northern Territory: No Camera Mobile Phone Enforcement',
        body: 'The Northern Territory does not operate camera-based mobile phone detection. All enforcement is police-issued. Camera data is not applicable.',
      },
      Both: {
        headline: 'Northern Territory 2024: Small Volumes, Police-Only',
        body: 'NT\'s 244 mobile phone fines represent the lowest volume of any jurisdiction. Without cameras, enforcement depends entirely on police officer availability and deployment across the territory\'s vast geography.',
      },
    },
    2023: {
      Police: {
        headline: 'Northern Territory 2023: 205 Police Mobile Phone Fines',
        body: 'NT police issued 205 mobile phone fines in 2023. 2023 was the first year NT reported age group and detection method detail for mobile phone enforcement.',
      },
      Camera: {
        headline: 'Northern Territory: No Camera Enforcement',
        body: 'No camera mobile phone enforcement in the NT. All figures are police-issued.',
      },
      Both: {
        headline: 'Northern Territory 2023: Police-Only Baseline',
        body: 'NT\'s 2023 data is a clean example of pure police mobile phone enforcement no cameras, small volumes, and a unique geographic policing context.',
      },
    },
  },
};

// ─── Fines heatmap stories ────────────────────────────────────────────────────

const FINES_STORIES = {
  both: {
    fullRange: {
      headline: '2008–2024: From Police Patrols to Automated Detection',
      body: 'Mobile phone fines in Australia tell a two-era story. From 2008 to 2019, enforcement was entirely police-driven and gradually declining from its 2010 peak of ~171,000 national fines. From 2020, NSW\'s camera rollout transformed the scale overnight. By 2023, automated cameras issued more mobile phone fines in a single year than police had managed in the entire prior decade combined.',
    },
    cameraEra: {
      headline: 'Camera Era (2020–2024): Automated Enforcement Dominates',
      body: 'Since 2020, camera-detected mobile phone fines have grown every year. By 2024, cameras in NSW, QLD, VIC, TAS, ACT and WA issue over 75% of all mobile phone fines nationally. Note: camera fines are collected by different agencies in each state NSW Revenue, QLD Dept. of Transport, Access Canberra (ACT) and all are included here.',
    },
    preCameraEra: {
      headline: 'Pre-Camera Era (2008–2019): Police-Only Enforcement',
      body: 'Before 2020, every mobile phone fine in Australia was issued by a police officer who had personally observed the offence. Volumes peaked around 2010 and declined steadily, reflecting shifting policing priorities rather than reduced offending. The apparent decline masked the growing scale of the problem that cameras would later reveal.',
    },
  },
  Police: {
    default: {
      headline: 'Police-Issued Mobile Phone Fines: A Decade of Decline',
      body: 'Police-issued mobile phone fines declined from ~156,000 nationally in 2008 to around 28,000 by 2024. This reflects the limits of manual detection officers can only observe so many drivers. The decline accelerated after 2020 in states that adopted cameras, as police were no longer the primary detection mechanism. Arrests are generally not applicable for mobile phone fines in NSW and Tasmania.',
    }
  },
  Camera: {
    default: {
      headline: 'Camera-Detected Mobile Phone Fines: Zero to Dominant',
      body: 'Camera detection of mobile phone use didn\'t exist until 2020. By 2023, cameras issued over 364,000 mobile phone fines nationally. Key state notes: NSW cameras (NSW Revenue) led with 202K; QLD cameras (Dept. of Transport) added 77K; ACT cameras launched in 2024 for 26K+; TAS cameras started from August 2023. WA camera detections result in charges rather than fines.',
    }
  },
};

// ─── Enforcement (Man vs Machine) stories ─────────────────────────────────────

const ENFORCEMENT_STORIES = {
  2020: {
    headline: '2020: NSW Launches Camera Detection',
    body: 'NSW deployed AI-powered mobile phone detection cameras in 2020, the first jurisdiction globally to do so at scale. Camera fines (138,847) nearly matched the entire national police total that year. Camera fines for NSW are collected by NSW Revenue, not NSW Police.',
  },
  2021: {
    headline: '2021: Queensland Cameras Come Online',
    body: 'QLD\'s Department of Transport and Main Roads deployed camera mobile phone detection in 2021, adding 14,574 camera fines. Note: QLD camera detections are reviewed by staff before fines are issued not all detections result in fines. Police fines continued declining nationally.',
  },
  2022: {
    headline: '2022: Cameras Issue 80% of All Mobile Phone Fines',
    body: 'By 2022, cameras issued 313,828 mobile phone fines nationally about 80% of all enforcement. NSW alone contributed 194,793. Police enforcement fell to its lowest level since records began. WA camera enforcement generates charges rather than fines, so its camera impact is in the charges column.',
  },
  2023: {
    headline: '2023: Peak Camera Volume, Tasmania Joins',
    body: 'National camera mobile phone fines peaked at over 364,000 in 2023. Tasmania\'s cameras came online from August 2023. Victoria expanded its camera network. Police issued fewer than 8% of all mobile phone fines nationally. Note: 2024 VIC police data is affected by Protected Industrial Action.',
  },
  2024: {
    headline: '2024: ACT Launches, National Volumes Stabilise',
    body: 'The ACT launched camera mobile phone enforcement in 2024, contributing 26,700+ fines. NSW camera volumes moderated to 147,272. Overall national camera volumes held broadly steady after the 2023 peak. Note: 2024 VIC police volumes are lower than usual due to Protected Industrial Action (PIA).',
  },
};

// ─── Renderer ────────────────────────────────────────────────────────────────

/**
 * Render a story panel into a target element.
 * @param {string}  targetId - ID of the container to inject into
 * @param {Object}  story  - { headline, body } or null to clear
 * @param {string[]} notes  - Optional HTML strings for dictionary notification pills
 */
export function renderStory(targetId, story, notes = []) {
  const el = document.getElementById(targetId);
  if (!el) return;

  if (!story && !notes.length) {
    el.innerHTML = '';
    el.style.display = 'none';
    return;
  }

  el.style.display = 'block';

  const notesHTML = notes.length
    ? `<div style="margin-top:0.75rem;display:flex;flex-direction:column;gap:0.4rem;">
        ${notes.map(n => `
          <div style="
            font-size:0.82rem;line-height:1.55;color:var(--text-secondary);
            padding:0.35rem 0.75rem;border-radius:5px;
            background:rgba(255,255,255,0.035);
            border-left:3px solid rgba(108,99,255,0.45);
          ">${n}</div>
        `).join('')}
      </div>`
    : '';

  if (!story) {
    el.innerHTML = `<div class="story-narrative-inner"><div style="flex:1;">${notesHTML}</div></div>`;
    return;
  }

  el.innerHTML = `
    <div class="story-narrative-inner">
      <div class="story-narrative-icon">📖</div>
      <div style="flex:1;">
        <h4 class="story-narrative-headline">${story.headline}</h4>
        <p class="story-narrative-body">${story.body}</p>
        ${notesHTML}
      </div>
    </div>
  `;
}

/**
 * Inject a story panel placeholder if not already present.
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
    headline: 'Comparing Mobile Phone Fines: ' + jurisdictions.join(', '),
    body: hasNSW
      ? 'NSW\'s 2020 camera rollout (NSW Revenue) is the dominant feature of this comparison. '
       + (hasQLD ? 'Queensland\'s camera program (Dept. of Transport and Main Roads) shows a similar but delayed spike from 2021. ' : '')
       + 'Other selected states show gradual police-only declines. Note: camera fines may come from a different agency than police fines in some states both are included.'
      : 'All selected jurisdictions rely predominantly on police-issued mobile phone fines. Compare the gradual national decline driven by shifting policing priorities against the backdrop of camera states where automated enforcement has redefined the scale entirely.',
  };
}

/**
 * Get demographic story keyed by jurisdiction × year × active methods.
 */
export function getDemographicStory(jurisdiction, year, activeMethods = []) {
  const jurStories = DEMOGRAPHIC_STORIES[jurisdiction];
  if (!jurStories) return null;

  const yearStories = jurStories[year];
  if (!yearStories) {
    return (TREND_STORIES[jurisdiction] && TREND_STORIES[jurisdiction].default) || null;
  }

  let methodKey = 'Both';
  if (activeMethods.length === 1) methodKey = activeMethods[0];

  return yearStories[methodKey]
    || yearStories['Both']
    || (TREND_STORIES[jurisdiction] && TREND_STORIES[jurisdiction].default)
    || null;
}

/**
 * Get data dictionary notes for a jurisdiction + active methods.
 * Pass null jurisdiction for national/multi-jurisdiction views.
 */
export function getDataNotes(jurisdiction, activeMethods = []) {
  const notes = [];

  if (jurisdiction && DATA_NOTES[jurisdiction]) {
    notes.push(...DATA_NOTES[jurisdiction]);
  }

  if (!jurisdiction) {
    notes.push(...NATIONAL_NOTES);
  }

  activeMethods.forEach(m => {
    if (METHOD_NOTES[m]) notes.push(...METHOD_NOTES[m]);
  });

  return notes;
}

export function getFinesStory(activeMethods, visibleYears) {
  if (!visibleYears || visibleYears.length === 0) return null;
  const min    = Math.min(...visibleYears);
  const max    = Math.max(...visibleYears);
  const methodKey = activeMethods.length === 2 ? 'both' : activeMethods[0];
  if (methodKey !== 'both') return FINES_STORIES[methodKey]?.default || null;
  if (min <= 2008 && max >= 2024) return FINES_STORIES.both.fullRange;
  if (min >= 2020)        return FINES_STORIES.both.cameraEra;
  if (max <= 2019)        return FINES_STORIES.both.preCameraEra;
  return FINES_STORIES.both.fullRange;
}

export function getEnforcementStory(maxYear) {
  return ENFORCEMENT_STORIES[maxYear] || ENFORCEMENT_STORIES[2024];
}