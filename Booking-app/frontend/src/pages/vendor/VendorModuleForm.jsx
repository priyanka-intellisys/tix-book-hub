import React, { useMemo, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

const apiBases = [
  "http://127.0.0.1:5000/api",
  "http://localhost:5000/api",
];

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

function VendorModuleForm({ module, title, description, fields, backPath = "/vendor-dashboard" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const editListing = location.state?.listing;

  const initialValues = useMemo(
    () =>
      fields.reduce((values, field) => ({
        ...values,
        [field.name]: editListing?.details?.[field.name] || field.defaultValue || "",
      }), {}),
    [editListing, fields]
  );

  const [form, setForm] = useState(initialValues);
  const [saving, setSaving] = useState(false);

  const updateField = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const sendVendorListingRequest = async ({ method, path, data, config }) => {
    let lastError;

    for (const baseUrl of apiBases) {
      const url = `${baseUrl}${path}`;

      try {
        console.log("[VendorModuleForm] API request", {
          method,
          url,
          module,
        });

        const response = await axios({
          method,
          url,
          data,
          ...config,
        });

        console.log("[VendorModuleForm] API success", {
          url,
          status: response.status,
          data: response.data,
        });

        return response;
      } catch (error) {
        lastError = error;
        console.error("[VendorModuleForm] API failed", {
          url,
          status: error.response?.status,
          response: error.response?.data,
          message: error.message,
        });

        const htmlResponse = typeof error.response?.data === "string" &&
          error.response.data.includes("Cannot POST /api/vendor-listings");

        if (!htmlResponse) {
          throw error;
        }
      }
    }

    throw lastError;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!getToken()) {
      alert("Login expired. Please login again.");
      navigate("/");
      return;
    }

    setSaving(true);

    const config = {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    };

    try {
      console.log("[VendorModuleForm] submitting vendor listing", {
        urls: apiBases.map((baseUrl) => `${baseUrl}/vendor-listings`),
        module,
        mode: editListing ? "edit" : "create",
        form,
      });

      if (editListing) {
        const res = await sendVendorListingRequest({
          method: "put",
          path: `/vendor-listings/${editListing._id}`,
          data: { module, details: form, status: editListing.status || "active" },
          config,
        });
        console.log("[VendorModuleForm] update success", res.data);
        alert("Listing updated");
      } else {
        const res = await sendVendorListingRequest({
          method: "post",
          path: "/vendor-listings",
          data: { module, details: form },
          config,
        });
        console.log("[VendorModuleForm] create success", res.data);
        alert("Listing added");
      }

      navigate(backPath, { state: { activePanel: "listings" } });
    } catch (error) {
      console.error("[VendorModuleForm] save failed", {
        status: error.response?.status,
        url: error.config?.url,
        response: error.response?.data,
        message: error.message,
      });
      const responseMessage = typeof error.response?.data === "string"
        ? error.response.data
        : error.response?.data?.message;
      const statusText = error.response?.status ? `Request failed (${error.response.status})` : "";
      alert(responseMessage || statusText || error.message || "Unable to save listing");
    } finally {
      setSaving(false);
    }
  };

  const previewUrl = form.imageUrl || form.bannerImageUrl;

  return (
    <div className="vendor-form-page">
      <div className="vendor-form-container">
        <div className="vendor-form-top">
          <h1>{editListing ? `Edit ${title}` : `Add ${title}`}</h1>
          <p>{description}</p>
        </div>

        <div className="vendor-form-card">
          <form className="vendor-module-form" onSubmit={handleSubmit}>
            <div className="vendor-form-grid">
              {fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  onChange={(value) => updateField(field.name, value)}
                />
              ))}
            </div>

            {previewUrl && (
              <div className="vendor-image-preview">
                <img src={previewUrl} alt="Listing preview" />
              </div>
            )}

            <button type="submit" className="vendor-submit-btn" disabled={saving}>
              {saving ? "Saving..." : editListing ? `Update ${title}` : `Add ${title}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ field, value, onChange }) {
  return (
    <div className={`vendor-form-group ${field.full ? "full" : ""}`}>
      <label>{field.label}</label>
      {field.type === "textarea" ? (
        <textarea
          value={value || ""}
          placeholder={field.placeholder || ""}
          onChange={(event) => onChange(event.target.value)}
          required={field.required !== false}
        />
      ) : (
        <input
          type={field.type || "text"}
          value={value || ""}
          placeholder={field.placeholder || ""}
          onChange={(event) => onChange(event.target.value)}
          min={field.min}
          required={field.required !== false}
        />
      )}
    </div>
  );
}

export default VendorModuleForm;
