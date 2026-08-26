BEGIN;

CREATE TABLE product_events (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES anonymous_sessions(session_id) ON DELETE CASCADE,
  event_dictionary_version text NOT NULL,
  event_name text NOT NULL,
  event_source text NOT NULL,
  properties_json jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT product_events_name_chk CHECK (event_name ~ '^[a-z][a-z0-9_]{2,63}$'),
  CONSTRAINT product_events_source_chk CHECK (event_source IN ('client','server')),
  CONSTRAINT product_events_properties_object_chk CHECK (jsonb_typeof(properties_json) = 'object'),
  CONSTRAINT product_events_private_payload_chk CHECK (
    NOT (properties_json ?| ARRAY[
      'answer','answerValue','answer_value','rawAnswer','rawAnswers','answers',
      'traitScores','traitVector','scoreBp','extendedCode','personalityCode',
      'responseQuality','interactionActiveIds','resultProse','freeText',
      'sessionToken','accessToken','publicToken','email','realName','preciseLocation'
    ])
  )
);

CREATE INDEX product_events_name_created_idx
  ON product_events(event_name, created_at);

CREATE INDEX product_events_session_idx
  ON product_events(session_id);

COMMIT;
