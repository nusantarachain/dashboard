

export default {
  Address: "MultiAddress",
  LookupSource: "MultiAddress",
  OrgId: "AccountId",
  "Organization": {
    "id": "AccountId",
    "name": "Vec<u8>",
    "description": "Vec<u8>",
    "admin": "AccountId",
    "website": "Vec<u8>",
    "email": "Vec<u8>",
    "suspended": "bool"
  },
  "CertId": "[u8; 32]",
  "IssuedId": "Vec<u8>",
  "CertDetail": {
      "name": "Vec<u8>",
      "description": "Vec<u8>",
      "org_id": "AccountId",
      "signer_name": "Vec<u8>"
  },
  "CertProof": {
      "cert_id": "CertId",
      "human_id": "Vec<u8>",
      "recipient": "Vec<u8>",
      "time": "Moment",
      "expired": "Moment",
      "revoked": "bool",
      "additional_data": "Option<Vec<u8>>"
  },
    "PropName": "Vec<u8>",
    "PropValue": "Vec<u8>",
    "ProductProperty": {
        "name": "PropName",
        "value": "PropValue"
    },
    "ProductId": "Vec<u8>",
    "Product": {
        "id": "ProductId",
        "owner": "AccountId",
        "props": "Option<Vec<ProductProperty>>",
        "registered": "Moment"
    },
"Identifier": "Vec<u8>",
    "Decimal": "i32",
    "TrackingId": "Identifier",
    "TrackingEventIndex": "u128",
    "DeviceId": "Identifier",
    "Year": "u32",
    "TrackingStatus": {
        "_enum": [
            "Pending",
            "InTransit",
            "Delivered"
        ]
    },
    "Track": {
        "id": "TrackingId",
        "owner": "AccountId",
        "status": "TrackingStatus",
        "products": "Vec<ProductId>",
        "registered": "Moment",
        "delivered": "Option<Moment>"
    },
    "TrackingEventType": {
        "_enum": [
            "TrackingRegistration",
            "TrackingPickup",
            "TrackingScan",
            "TrackingDeliver"
        ]
    },
    "TrackingEvent": {
        "event_type": "TrackingEventType",
        "shipment_id": "TrackingId",
        "location": "Option<ReadPoint>",
        "readings": "Vec<Reading<Moment>>",
        "timestamp": "Moment"
    },
    "ReadPoint": {
        "latitude": "Decimal",
        "longitude": "Decimal"
    },
    "ReadingType": {
        "_enum": [
            "Humidity",
            "Pressure",
            "Shock",
            "Tilt",
            "Temperature",
            "Vibration"
        ]
    },
    "Reading": {
        "device_id": "DeviceId",
        "reading_type": "ReadingType",
        "timestamp": "Moment",
        "value": "Decimal"
    }
};
