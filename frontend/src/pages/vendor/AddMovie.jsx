import React, { useEffect, useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddMovie.css";

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

const getStoredUser = () => {
  const raw = localStorage.getItem("ticketproUser") || sessionStorage.getItem("ticketproUser");
  return raw ? JSON.parse(raw) : {};
};

const languageOptions = ["Hindi", "English", "Marathi", "Tamil", "Telugu", "Malayalam", "Kannada", "Punjabi", "Bengali"];
const genreOptions = ["Action", "Comedy", "Drama", "Thriller", "Horror", "Romance", "Adventure", "Sci-Fi", "Family", "Animation"];
const certificateOptions = ["U", "U-A", "A"];
const movieStatuses = ["draft", "upcoming", "booking_open", "now_showing", "house_full", "ended", "cancelled"];
const documentTypes = ["Movie Permission Document", "Distributor Agreement", "Theatre Agreement", "Government Certificate", "Other Supporting Documents"];

const emptyMovie = {
  title: "",
  language: "Hindi",
  duration: "",
  image: "",
  posterUrl: "",
  bannerUrl: "",
  trailerFileUrl: "",
  galleryImages: [],
  documents: [],
  description: "",
  theatre: "",
  screenName: "",
  city: "",
  location: "",
  showDate: "",
  showTime: "",
  endTime: "",
  totalSeats: 120,
  ticketPrice: 250,
  regularRows: 8,
  regularSeatsPerRow: 10,
  primeRows: 3,
  primeSeatsPerRow: 10,
  vipRows: 1,
  vipSeatsPerRow: 10,
  regularSeatPrice: 250,
  premiumSeatPrice: 350,
  vipSeatPrice: 500,
  genre: "Action",
  cast: "",
  director: "",
  releaseDate: "",
  hero: "",
  certificate: "U-A",
  format: "2D",
  trailerUrl: "",
  interestCount: "",
  aboutMovie: "",
  status: "draft",
  seatLayout: [],
  regularSeatCount: 0,
  primeSeatCount: 0,
  vipSeatCount: 0,
  blockedSeats: [],
  isOfferApplicable: false,
  offers: [],
  castMembers: [],
  crewMembers: [],
  vendorId: "",
};

const readFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, data: reader.result });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

function AddMovie() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMovie = location.state?.movie;
  const user = getStoredUser();

  const [movie, setMovie] = useState({
    ...emptyMovie,
    ...(editMovie || {}),
    offers: editMovie?.offers?.length ? editMovie.offers : [],
    castMembers: editMovie?.castMembers?.length ? editMovie.castMembers : [],
    crewMembers: editMovie?.crewMembers?.length ? editMovie.crewMembers : [],
  });
  const [uploads, setUploads] = useState({
    poster: null,
    banner: null,
    gallery: [],
    trailer: null,
    documents: [],
  });
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    const loadVendors = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/vendors", {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const list = Array.isArray(response.data) ? response.data : [];
        setVendors(list);
        setMovie((current) => ({
          ...current,
          vendorId: current.vendorId || current.vendor || list[0]?._id || list[0]?.id || user._id || user.id || "",
        }));
      } catch {
        setVendors(user.id || user._id ? [{ id: user.id || user._id, _id: user.id || user._id, name: user.name || "Current vendor" }] : []);
      }
    };
    loadVendors();
  }, [user.id, user._id, user.name]);

  const rowIndex = (label) => String(label || "").toUpperCase().split("").reduce((sum, char) => sum * 26 + char.charCodeAt(0) - 64, 0) - 1;
  const generatedRows = (start, end) => {
    const from = rowIndex(start);
    const to = rowIndex(end);
    return from >= 0 && to >= from ? to - from + 1 : 0;
  };
  const generatedSeats = (start, end, seatsPerRow) => generatedRows(start, end) * Number(seatsPerRow || 0);
  const seatSummary = {
    regular: Number(movie.regularRows || 0) * Number(movie.regularSeatsPerRow || 0),
    prime: Number(movie.primeRows || 0) * Number(movie.primeSeatsPerRow || 0),
    vip: Number(movie.vipRows || 0) * Number(movie.vipSeatsPerRow || 0),
  };
  const seatTotal = seatSummary.regular + seatSummary.prime + seatSummary.vip;

  const updateField = (field, value) => {
    setMovie((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const toggleBlockedSeat = (seatNo) => {
    setMovie((current) => {
      const blockedSeats = current.blockedSeats || [];
      return {
        ...current,
        blockedSeats: blockedSeats.includes(seatNo)
          ? blockedSeats.filter((seat) => seat !== seatNo)
          : [...blockedSeats, seatNo],
      };
    });
  };

  const addListItem = (field, item) => {
    setMovie((current) => ({
      ...current,
      [field]: [...(current[field] || []), item],
    }));
  };

  const updateListItem = (field, index, key, value) => {
    setMovie((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: value } : item
      ),
    }));
  };

  const removeListItem = (field, index) => {
    setMovie((current) => ({
      ...current,
      [field]: current[field].filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const config = {
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
    };

    try {
      const uploadPayload = {
        poster: uploads.poster ? await readFile(uploads.poster) : null,
        banner: uploads.banner ? await readFile(uploads.banner) : null,
        gallery: await Promise.all((uploads.gallery || []).map(readFile)),
        trailer: uploads.trailer ? await readFile(uploads.trailer) : null,
        documents: await Promise.all((uploads.documents || []).filter((item) => item.file).map(async (item) => ({
          documentType: item.documentType,
          file: await readFile(item.file),
        }))),
      };
      const payload = {
        ...movie,
        vendorId: movie.vendorId || movie.vendor || user.id || user._id,
        vendor: movie.vendorId || movie.vendor || user.id || user._id,
        totalSeats: seatTotal || movie.totalSeats,
        regularSeatCount: seatSummary.regular,
        primeSeatCount: seatSummary.prime,
        vipSeatCount: seatSummary.vip,
        regularSeats: seatSummary.regular,
        primeSeats: seatSummary.prime,
        vipSeats: seatSummary.vip,
        ticketPrice: movie.regularSeatPrice || movie.ticketPrice,
        uploads: uploadPayload,
      };

      if (editMovie) {
        await axios.put(
          `http://localhost:5000/api/vendor/movies/${editMovie._id}`,
          payload,
          config
        );
        alert("Movie updated");
      } else {
        await axios.post("http://localhost:5000/api/vendor/movies", payload, config);
        alert("Movie added");
      }

      navigate("/vendor/movies");
    } catch (error) {
      alert(error.response?.data?.message || "Unable to save movie");
    }
  };

  return (
    <div className="add-movie-page">
      <div className="add-movie-container">
        <div className="add-movie-top">
          <h1>{editMovie ? "Edit Movie" : "Add New Movie"}</h1>
          <p>Configure the complete movie detail page shown to customers.</p>
        </div>

        <div className="add-movie-card">
          <form className="add-movie-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <SelectField label="Vendor" value={movie.vendorId || movie.vendor} options={vendors.map((vendor) => ({ value: vendor._id || vendor.id, label: vendor.name || vendor.email || "Vendor" }))} onChange={(value) => updateField("vendorId", value)} required />
              <Field label="Movie Name" value={movie.title} onChange={(value) => updateField("title", value)} required />
              <SelectField label="Language" value={movie.language} options={languageOptions} onChange={(value) => updateField("language", value)} required />
              <Field label="Duration" value={movie.duration} onChange={(value) => updateField("duration", value)} placeholder="2h 46m" required />
              <SelectField label="Genre" value={movie.genre} options={genreOptions} onChange={(value) => updateField("genre", value)} required />
              <SelectField label="Certificate" value={movie.certificate} options={certificateOptions} onChange={(value) => updateField("certificate", value)} />
              <Field label="Format" value={movie.format} onChange={(value) => updateField("format", value)} placeholder="2D" />
              <Field label="Release Date" type="date" value={movie.releaseDate} onChange={(value) => updateField("releaseDate", value)} required />
              <SelectField label="Movie Status" value={movie.status} options={movieStatuses} onChange={(value) => updateField("status", value)} />
              <Field label="Trailer URL Optional" value={movie.trailerUrl} onChange={(value) => updateField("trailerUrl", value)} />
              <Field label="Theatre Name" value={movie.theatre} onChange={(value) => updateField("theatre", value)} required />
              <Field label="Screen Name" value={movie.screenName} onChange={(value) => updateField("screenName", value)} required />
              <Field label="City" value={movie.city} onChange={(value) => updateField("city", value)} required />
              <Field label="Location" value={movie.location} onChange={(value) => updateField("location", value)} />
              <Field label="Show Date" type="date" value={movie.showDate} onChange={(value) => updateField("showDate", value)} />
              <Field label="Show Time" type="time" value={movie.showTime} onChange={(value) => updateField("showTime", value)} />
              <Field label="End Time" type="time" value={movie.endTime} onChange={(value) => updateField("endTime", value)} />
              <Field label="Regular Rows" type="number" value={movie.regularRows} onChange={(value) => updateField("regularRows", value)} />
              <Field label="Regular Seats Per Row" type="number" value={movie.regularSeatsPerRow} onChange={(value) => updateField("regularSeatsPerRow", value)} />
              <Field label="Prime Rows" type="number" value={movie.primeRows} onChange={(value) => updateField("primeRows", value)} />
              <Field label="Prime Seats Per Row" type="number" value={movie.primeSeatsPerRow} onChange={(value) => updateField("primeSeatsPerRow", value)} />
              <Field label="VIP Rows" type="number" value={movie.vipRows} onChange={(value) => updateField("vipRows", value)} />
              <Field label="VIP Seats Per Row" type="number" value={movie.vipSeatsPerRow} onChange={(value) => updateField("vipSeatsPerRow", value)} />
              <Field label="Regular Seat Price" type="number" value={movie.regularSeatPrice} onChange={(value) => updateField("regularSeatPrice", value)} required />
              <Field label="Prime Seat Price" type="number" value={movie.premiumSeatPrice} onChange={(value) => updateField("premiumSeatPrice", value)} />
              <Field label="VIP Seat Price" type="number" value={movie.vipSeatPrice} onChange={(value) => updateField("vipSeatPrice", value)} />
              <Field label="Interested Count" value={movie.interestCount} onChange={(value) => updateField("interestCount", value)} placeholder="11.3K+ are interested" />
              <Field label="Hero / Lead" value={movie.hero} onChange={(value) => updateField("hero", value)} />
              <Field label="Legacy Cast Text" value={movie.cast} onChange={(value) => updateField("cast", value)} />
              <Field label="Director" value={movie.director} onChange={(value) => updateField("director", value)} />
            </div>

            <div className="section-editor">
              <div className="section-editor-top">
                <h2>Image & File Storage</h2>
              </div>
              <div className="file-grid">
                <FileField label="Movie Poster Upload" accept="image/*" onChange={(file) => setUploads((current) => ({ ...current, poster: file }))} />
                <FileField label="Movie Banner Upload" accept="image/*" onChange={(file) => setUploads((current) => ({ ...current, banner: file }))} />
                <FileField label="Movie Gallery Images Upload" accept="image/*" multiple onChange={(files) => setUploads((current) => ({ ...current, gallery: files }))} />
                <FileField label="Trailer Upload" accept="video/*" onChange={(file) => setUploads((current) => ({ ...current, trailer: file }))} />
              </div>
              <Field label="Poster URL Fallback" value={movie.image} onChange={(value) => updateField("image", value)} />
              <Field label="Banner URL Fallback" value={movie.bannerUrl} onChange={(value) => updateField("bannerUrl", value)} />
            </div>

            {(movie.image || movie.posterUrl) && (
              <div className="poster-preview">
                <img src={movie.posterUrl || movie.image} alt="Poster" />
              </div>
            )}

            <TextArea label="Short Description" value={movie.description} onChange={(value) => updateField("description", value)} />
            <TextArea label="About Movie" value={movie.aboutMovie} onChange={(value) => updateField("aboutMovie", value)} />

            <div className="section-editor">
              <div className="section-editor-top">
                <h2>Seat Layout Generator</h2>
              </div>
              <SeatPreview
                movie={movie}
                onToggleBlocked={toggleBlockedSeat}
              />
            </div>

            <DocumentEditor documents={uploads.documents} onChange={(documents) => setUploads((current) => ({ ...current, documents }))} />

            <PeopleEditor
              title="Cast with Photos"
              addLabel="Add Cast"
              items={movie.castMembers}
              onAdd={() => addListItem("castMembers", { name: "", role: "Actor", photo: "" })}
              onUpdate={(index, key, value) => updateListItem("castMembers", index, key, value)}
              onRemove={(index) => removeListItem("castMembers", index)}
            />

            <PeopleEditor
              title="Crew"
              addLabel="Add Crew"
              items={movie.crewMembers}
              onAdd={() => addListItem("crewMembers", { name: "", role: "Director", photo: "" })}
              onUpdate={(index, key, value) => updateListItem("crewMembers", index, key, value)}
              onRemove={(index) => removeListItem("crewMembers", index)}
            />

            <div className="section-editor">
              <div className="section-editor-top">
                <div>
                  <h2>Offers</h2>
                  <label className="offer-toggle">
                    <input
                      type="checkbox"
                      checked={movie.isOfferApplicable}
                      onChange={(e) => updateField("isOfferApplicable", e.target.checked)}
                    />
                    Offer is applicable
                  </label>
                </div>
                <button type="button" onClick={() => addListItem("offers", { title: "", description: "" })}>
                  Add Offer
                </button>
              </div>

              {(movie.offers || []).map((offer, index) => (
                <div className="repeat-row offer-row" key={`offer-${index}`}>
                  <input
                    type="text"
                    placeholder="Offer title"
                    value={offer.title}
                    onChange={(e) => updateListItem("offers", index, "title", e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Offer description"
                    value={offer.description}
                    onChange={(e) => updateListItem("offers", index, "description", e.target.value)}
                  />
                  <button type="button" onClick={() => removeListItem("offers", index)}>
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="submit" className="add-movie-btn">
              {editMovie ? "Update Movie" : "Add Movie"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange, required = false }) {
  const normalized = options.map((option) => (typeof option === "string" ? { value: option, label: option.replace(/_/g, " ") } : option));
  return (
    <div className="form-group">
      <label>{label}</label>
      <select value={value || ""} required={required} onChange={(e) => onChange(e.target.value)}>
        {normalized.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", required = false }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        required={required}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function FileField({ label, accept, multiple = false, onChange }) {
  return (
    <div className="form-group file-field">
      <label>{label}</label>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={(e) => onChange(multiple ? Array.from(e.target.files || []) : e.target.files?.[0] || null)}
      />
    </div>
  );
}

function SeatPreview({ movie, onToggleBlocked }) {
  const rowNameForIndex = (index) => {
    let value = Number(index);
    let label = "";
    do {
      label = String.fromCharCode(65 + (value % 26)) + label;
      value = Math.floor(value / 26) - 1;
    } while (value >= 0);
    return label;
  };
  const sections = [
    { title: "VIP Rows", type: "vip", rows: Number(movie.vipRows || 0), seatsPerRow: Number(movie.vipSeatsPerRow || 0), price: movie.vipSeatPrice },
    { title: "Prime Rows", type: "prime", rows: Number(movie.primeRows || 0), seatsPerRow: Number(movie.primeSeatsPerRow || 0), price: movie.premiumSeatPrice },
    { title: "Regular Rows", type: "regular", rows: Number(movie.regularRows || 0), seatsPerRow: Number(movie.regularSeatsPerRow || 0), price: movie.regularSeatPrice },
  ];
  const blockedSeats = new Set(movie.blockedSeats || []);
  let rowIndex = 0;

  const layout = sections.map((section) => {
    const rows = [];
    for (let rowOffset = 0; rowOffset < section.rows; rowOffset += 1) {
      const rowName = rowNameForIndex(rowIndex);
      const seats = Array.from({ length: section.seatsPerRow }, (_, seatIndex) => String(seatIndex + 1).padStart(2, "0"));
      rows.push({ rowName, seats });
      rowIndex += 1;
    }
    return { ...section, rows };
  }).filter((section) => section.rows.length);

  return (
    <div className="bms-seat-layout">
      <div className="bms-screen">SCREEN</div>
      {layout.map((section) => (
        <section className="bms-seat-section" key={section.type}>
          <div className="bms-section-title">
            <strong>{section.title}</strong>
            <span>Rs {section.price || 0}</span>
          </div>
          {section.rows.map((row) => (
            <div className="bms-seat-row" key={row.rowName}>
              <b>{row.rowName}</b>
              <div className="bms-seat-numbers">
                {row.seats.map((seat) => {
                  const seatNo = `${row.rowName}${seat}`;
                  return (
                    <button
                      type="button"
                      className={`${section.type} ${blockedSeats.has(seatNo) ? "blocked" : ""}`}
                      key={seatNo}
                      onClick={() => onToggleBlocked(seatNo)}
                      title={blockedSeats.has(seatNo) ? "Blocked" : "Available"}
                    >
                      {seat}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
      <div className="bms-block-summary">
        <strong>Blocked Seats</strong>
        <span>{(movie.blockedSeats || []).length ? movie.blockedSeats.join(", ") : "None"}</span>
      </div>
    </div>
  );
}

function DocumentEditor({ documents, onChange }) {
  const addDocument = () => onChange([...documents, { documentType: documentTypes[0], file: null }]);
  const updateDocument = (index, patch) => {
    onChange(documents.map((document, documentIndex) => documentIndex === index ? { ...document, ...patch } : document));
  };

  return (
    <div className="section-editor">
      <div className="section-editor-top">
        <h2>Document Upload Section</h2>
        <button type="button" onClick={addDocument}>Add Document</button>
      </div>

      {documents.map((document, index) => (
        <div className="repeat-row document-row" key={`document-${index}`}>
          <select value={document.documentType} onChange={(e) => updateDocument(index, { documentType: e.target.value })}>
            {documentTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
          <input accept=".pdf,.jpg,.jpeg,.png,.docx" type="file" onChange={(e) => updateDocument(index, { file: e.target.files?.[0] || null })} />
          <button type="button" onClick={() => onChange(documents.filter((_, documentIndex) => documentIndex !== index))}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

function PeopleEditor({ title, addLabel, items, onAdd, onUpdate, onRemove }) {
  return (
    <div className="section-editor">
      <div className="section-editor-top">
        <h2>{title}</h2>
        <button type="button" onClick={onAdd}>
          {addLabel}
        </button>
      </div>

      {(items || []).map((member, index) => (
        <div className="repeat-row" key={`${title}-${index}`}>
          <input
            type="text"
            placeholder="Name"
            value={member.name || ""}
            onChange={(e) => onUpdate(index, "name", e.target.value)}
          />
          <input
            type="text"
            placeholder="Role"
            value={member.role || ""}
            onChange={(e) => onUpdate(index, "role", e.target.value)}
          />
          <input
            type="text"
            placeholder="Photo URL"
            value={member.photo || ""}
            onChange={(e) => onUpdate(index, "photo", e.target.value)}
          />
          <button type="button" onClick={() => onRemove(index)}>
            Remove
          </button>
        </div>
      ))}
    </div>
  );
}

export default AddMovie;
