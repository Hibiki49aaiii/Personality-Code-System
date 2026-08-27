import dictionaryJson from '../../../data/analytics/event-dictionary-v0.1-dev.json';

export type ProductEventSource = 'client' | 'server' | 'either';
export type ProductEventSessionScope = 'none' | 'optional' | 'required';

type PropertySpec =
  | { type: 'string'; max_length: number }
  | { type: 'integer'; min: number; max: number }
  | { type: 'boolean' }
  | { type: 'enum'; values: string[] };

interface EventDefinition {
  name: string;
  source: ProductEventSource;
  session_scope: ProductEventSessionScope;
  required_properties: string[];
  properties: Record<string, PropertySpec>;
}

interface EventDictionary {
  event_dictionary_version: string;
  transport_policy: 'first-party-only';
  third_party_export_default: false;
  forbidden_property_keys: string[];
  events: EventDefinition[];
}

const dictionary = dictionaryJson as unknown as EventDictionary;
const byName = new Map(dictionary.events.map((event) => [event.name, event]));
const forbiddenLower = new Set(dictionary.forbidden_property_keys.map((key) => key.toLowerCase()));

export const PRODUCT_EVENT_DICTIONARY_VERSION = dictionary.event_dictionary_version;

export class ProductEventValidationError extends Error {
  constructor(
    public readonly code:
      | 'UNKNOWN_EVENT'
      | 'SOURCE_NOT_ALLOWED'
      | 'INVALID_PROPERTIES'
      | 'UNKNOWN_PROPERTY'
      | 'FORBIDDEN_PROPERTY'
      | 'INVALID_PROPERTY_VALUE',
    message: string
  ) {
    super(message);
    this.name = 'ProductEventValidationError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateValue(eventName: string, key: string, spec: PropertySpec, value: unknown): void {
  if (spec.type === 'string') {
    if (typeof value !== 'string' || value.length < 1 || value.length > spec.max_length) {
      throw new ProductEventValidationError('INVALID_PROPERTY_VALUE', `${eventName}.${key} must be a bounded string`);
    }
    return;
  }
  if (spec.type === 'integer') {
    if (!Number.isSafeInteger(value) || (value as number) < spec.min || (value as number) > spec.max) {
      throw new ProductEventValidationError('INVALID_PROPERTY_VALUE', `${eventName}.${key} must be an integer in range`);
    }
    return;
  }
  if (spec.type === 'boolean') {
    if (typeof value !== 'boolean') {
      throw new ProductEventValidationError('INVALID_PROPERTY_VALUE', `${eventName}.${key} must be boolean`);
    }
    return;
  }
  if (typeof value !== 'string' || !spec.values.includes(value)) {
    throw new ProductEventValidationError('INVALID_PROPERTY_VALUE', `${eventName}.${key} must be an allowed enum value`);
  }
}

export interface ValidatedProductEvent {
  dictionaryVersion: string;
  name: string;
  source: ProductEventSource;
  sessionScope: ProductEventSessionScope;
  properties: Record<string, string | number | boolean>;
}

export function validateProductEvent(input: {
  name: string;
  source: 'client' | 'server';
  properties?: unknown;
}): ValidatedProductEvent {
  const definition = byName.get(input.name);
  if (!definition) {
    throw new ProductEventValidationError('UNKNOWN_EVENT', `Unknown product event ${input.name}`);
  }
  if (definition.source !== 'either' && definition.source !== input.source) {
    throw new ProductEventValidationError('SOURCE_NOT_ALLOWED', `${input.name} cannot be recorded from ${input.source}`);
  }

  const incoming = input.properties ?? {};
  if (!isPlainObject(incoming)) {
    throw new ProductEventValidationError('INVALID_PROPERTIES', 'Event properties must be a flat object');
  }

  for (const requiredKey of definition.required_properties) {
    if (!(requiredKey in incoming)) {
      throw new ProductEventValidationError(
        'INVALID_PROPERTIES',
        `${input.name}: missing required property ${requiredKey}`
      );
    }
  }

  const canonical: Record<string, string | number | boolean> = {};
  for (const key of Object.keys(incoming).sort()) {
    if (forbiddenLower.has(key.toLowerCase())) {
      throw new ProductEventValidationError('FORBIDDEN_PROPERTY', `${input.name}: prohibited property ${key}`);
    }
    const spec = definition.properties[key];
    if (!spec) {
      throw new ProductEventValidationError('UNKNOWN_PROPERTY', `${input.name}: property ${key} is not allowlisted`);
    }
    const value = incoming[key];
    validateValue(input.name, key, spec, value);
    canonical[key] = value as string | number | boolean;
  }

  return {
    dictionaryVersion: dictionary.event_dictionary_version,
    name: definition.name,
    source: input.source,
    sessionScope: definition.session_scope,
    properties: canonical
  };
}

export function getProductEventDefinition(name: string): EventDefinition | null {
  return byName.get(name) ?? null;
}
