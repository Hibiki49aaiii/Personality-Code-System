import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRODUCT_EVENT_DICTIONARY_VERSION,
  ProductEventValidationError,
  validateProductEvent
} from '../../src/domain/analytics/productEvent';

test('analytics event validator accepts only allowlisted bounded properties', () => {
  const event = validateProductEvent({
    name: 'question_viewed',
    source: 'client',
    properties: { itemPosition: 12, modelVersion: 'assessment-dev-v0.3' }
  });

  assert.equal(event.dictionaryVersion, PRODUCT_EVENT_DICTIONARY_VERSION);
  assert.equal(event.name, 'question_viewed');
  assert.deepEqual(event.properties, {
    itemPosition: 12,
    modelVersion: 'assessment-dev-v0.3'
  });
});

test('analytics event validator rejects raw answer-like properties even on otherwise valid events', () => {
  assert.throws(
    () => validateProductEvent({
      name: 'answer_interaction',
      source: 'client',
      properties: {
        modelVersion: 'assessment-dev-v0.3',
        itemPosition: 1,
        interactionType: 'selected',
        answerValue: 5
      }
    }),
    (error: unknown) =>
      error instanceof ProductEventValidationError &&
      error.code === 'FORBIDDEN_PROPERTY'
  );
});

test('analytics event validator requires event-specific required properties', () => {
  assert.throws(
    () => validateProductEvent({
      name: 'share_method_selected',
      source: 'client',
      properties: {}
    }),
    (error: unknown) =>
      error instanceof ProductEventValidationError &&
      error.code === 'INVALID_PROPERTIES'
  );
});

test('server-only events cannot be forged through the client source', () => {
  assert.throws(
    () => validateProductEvent({
      name: 'share_snapshot_created',
      source: 'client',
      properties: { shareSchemaVersion: 'share-snapshot-v0.1-dev' }
    }),
    (error: unknown) =>
      error instanceof ProductEventValidationError &&
      error.code === 'SOURCE_NOT_ALLOWED'
  );
});

test('analytics enum and integer ranges fail closed', () => {
  assert.throws(
    () => validateProductEvent({
      name: 'question_viewed',
      source: 'client',
      properties: { modelVersion: 'assessment-dev-v0.3', itemPosition: 0 }
    }),
    ProductEventValidationError
  );
  assert.throws(
    () => validateProductEvent({
      name: 'share_method_selected',
      source: 'client',
      properties: { method: 'unknown-network' }
    }),
    ProductEventValidationError
  );
});
