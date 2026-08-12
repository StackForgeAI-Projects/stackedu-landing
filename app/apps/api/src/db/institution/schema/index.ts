/**
 * The complete schema for a single institution's database.
 *
 * Every institution has an identical copy of this structure. There are no
 * per-institution schema differences — behaviour that varies between
 * institutions is driven by rows in institution_settings, never by different
 * columns, because divergent schemas would make migrations unmanageable.
 */
export * from './academic'
export * from './admissions'
export * from './ai'
export * from './assessment'
export * from './communication'
export * from './enums'
export * from './finance'
export * from './library'
export * from './people'
export * from './settings'
export * from './students'
export * from './teaching'
