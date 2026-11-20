"use client";

import Link from "next/link";
import { useState } from "react";

type OnboardingDetails = {
  pharmacyName: string;
  ownerName: string;
  phone: string;
  email: string;
  address: string;
  registration: string;
};

const emptyDetails: OnboardingDetails = {
  pharmacyName: "",
  ownerName: "",
  phone: "",
  email: "",
  address: "",
  registration: "",
};

export function OnboardingPreview() {
  const [details, setDetails] = useState(emptyDetails);
  const [submitted, setSubmitted] = useState(false);

  function update(field: keyof OnboardingDetails, value: string) {
    setDetails((current) => ({ ...current, [field]: value }));
  }

  if (submitted) {
    return (
      <div className="onboarding-success" role="status">
        <span className="success-icon">✓</span>
        <strong>{details.pharmacyName}</strong>
        <p>
          This is a local preview. The pharmacy workspace has not been created,
          and these details were not saved or sent.
        </p>
        <Link className="button button-primary button-full" href="/">
          Return to workspace
        </Link>
        <button
          className="button button-quiet button-full"
          onClick={() => setSubmitted(false)}
          type="button"
        >
          Edit preview details
        </button>
      </div>
    );
  }

  return (
    <form
      className="auth-form onboarding-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
      }}
    >
      <label>
        Pharmacy name
        <input
          autoComplete="organization"
          onChange={(event) => update("pharmacyName", event.target.value)}
          required
          value={details.pharmacyName}
        />
      </label>
      <label>
        Owner name
        <input
          autoComplete="name"
          onChange={(event) => update("ownerName", event.target.value)}
          required
          value={details.ownerName}
        />
      </label>
      <div className="form-two-column">
        <label>
          Phone
          <input
            autoComplete="tel"
            inputMode="tel"
            onChange={(event) => update("phone", event.target.value)}
            pattern="[0-9+() -]{8,18}"
            placeholder="+91"
            required
            type="tel"
            value={details.phone}
          />
        </label>
        <label>
          Email
          <input
            autoComplete="email"
            onChange={(event) => update("email", event.target.value)}
            required
            type="email"
            value={details.email}
          />
        </label>
      </div>
      <label>
        Pharmacy address
        <textarea
          autoComplete="street-address"
          onChange={(event) => update("address", event.target.value)}
          required
          rows={3}
          value={details.address}
        />
      </label>
      <label>
        Pharmacy registration / license
        <span className="optional-text">Optional</span>
        <input
          autoComplete="off"
          onChange={(event) => update("registration", event.target.value)}
          value={details.registration}
        />
      </label>
      <p className="form-notice">
        Preview only. Details stay in this page and will not be persisted.
      </p>
      <button className="button button-primary button-full" type="submit">
        Preview workspace setup
      </button>
    </form>
  );
}
