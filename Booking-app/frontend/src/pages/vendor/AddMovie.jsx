import React, { useState } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddMovie.css";

const getToken = () =>
  localStorage.getItem("token") ||
  sessionStorage.getItem("token");

const emptyMovie = {
  title: "",
  language: "",
  duration: "",
  image: "",
  description: "",
  theatre: "",
  genre: "",
  cast: "",
  director: "",
  releaseDate: "",
  rating: "",
  hero: "",
  certificate: "",
  format: "2D",
  trailerUrl: "",
  interestCount: "",
  aboutMovie: "",
  isOfferApplicable: false,
  offers: [],
  castMembers: [],
  crewMembers: [],
};

function AddMovie() {
  const navigate = useNavigate();
  const location = useLocation();
  const editMovie = location.state?.movie;

  const [movie, setMovie] = useState({
    ...emptyMovie,
    ...(editMovie || {}),
    offers: editMovie?.offers?.length ? editMovie.offers : [],
    castMembers: editMovie?.castMembers?.length ? editMovie.castMembers : [],
    crewMembers: editMovie?.crewMembers?.length ? editMovie.crewMembers : [],
  });

  const updateField = (field, value) => {
    setMovie((current) => ({
      ...current,
      [field]: value,
    }));
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
      },
    };

    try {
      if (editMovie) {
        await axios.put(
          `http://localhost:5000/api/edit-movie/${editMovie._id}`,
          movie,
          config
        );
        alert("Movie updated");
      } else {
        await axios.post("http://localhost:5000/api/add-movie", movie, config);
        alert("Movie added");
      }

      navigate("/vendor-dashboard");
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
              <Field label="Movie Title" value={movie.title} onChange={(value) => updateField("title", value)} />
              <Field label="Language" value={movie.language} onChange={(value) => updateField("language", value)} />
              <Field label="Duration" value={movie.duration} onChange={(value) => updateField("duration", value)} placeholder="2h 46m" />
              <Field label="Genre" value={movie.genre} onChange={(value) => updateField("genre", value)} placeholder="Drama, Romantic" />
              <Field label="Certificate" value={movie.certificate} onChange={(value) => updateField("certificate", value)} placeholder="UA16+" />
              <Field label="Format" value={movie.format} onChange={(value) => updateField("format", value)} placeholder="2D" />
              <Field label="Release Date" type="date" value={movie.releaseDate} onChange={(value) => updateField("releaseDate", value)} />
              <Field label="Rating" value={movie.rating} onChange={(value) => updateField("rating", value)} placeholder="8.8/10" />
              <Field label="Theatre" value={movie.theatre} onChange={(value) => updateField("theatre", value)} />
              <Field label="Interested Count" value={movie.interestCount} onChange={(value) => updateField("interestCount", value)} placeholder="11.3K+ are interested" />
              <Field label="Trailer URL" value={movie.trailerUrl} onChange={(value) => updateField("trailerUrl", value)} />
              <Field label="Hero / Lead" value={movie.hero} onChange={(value) => updateField("hero", value)} />
              <Field label="Legacy Cast Text" value={movie.cast} onChange={(value) => updateField("cast", value)} />
              <Field label="Director" value={movie.director} onChange={(value) => updateField("director", value)} />
            </div>

            <Field label="Poster URL" value={movie.image} onChange={(value) => updateField("image", value)} />

            {movie.image && (
              <div className="poster-preview">
                <img src={movie.image} alt="Poster" />
              </div>
            )}

            <TextArea label="Short Description" value={movie.description} onChange={(value) => updateField("description", value)} />
            <TextArea label="About Movie" value={movie.aboutMovie} onChange={(value) => updateField("aboutMovie", value)} />

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

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
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
