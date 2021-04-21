

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
  }
};
