import { createRegistry } from '@bufbuild/protobuf';
import {
  BoolValueSchema,
  BytesValueSchema,
  DoubleValueSchema,
  DurationSchema,
  FloatValueSchema,
  Int32ValueSchema,
  Int64ValueSchema,
  ListValueSchema,
  StringValueSchema,
  StructSchema,
  TimestampSchema,
  UInt32ValueSchema,
  UInt64ValueSchema,
  ValueSchema,
} from '@bufbuild/protobuf/wkt';

// google.protobuf.Any is decoded by looking up its packed type by name in a registry — unlike a
// field with a static well-known type (e.g. metadata.creation_timestamp), Any's packed type is
// only known at runtime from its "@type" URL. Without an entry here, @bufbuild/protobuf throws
// "cannot decode message google.protobuf.Any from JSON: <type> is not in the type registry".
//
// ClusterTemplateParameterDefinition.default (and the equivalent field on other template types) is
// documented to pack one of these well-known types, so all of them must be registered for the
// catalog item wizards' template dropdowns to decode successfully.
export const wellKnownTypeRegistry = createRegistry(
  BoolValueSchema,
  BytesValueSchema,
  DoubleValueSchema,
  DurationSchema,
  FloatValueSchema,
  Int32ValueSchema,
  Int64ValueSchema,
  ListValueSchema,
  StringValueSchema,
  StructSchema,
  TimestampSchema,
  UInt32ValueSchema,
  UInt64ValueSchema,
  ValueSchema,
);
