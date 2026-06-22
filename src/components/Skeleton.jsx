import React from "react"

export default function Skeleton() {
  return (
    <div className="skeleton-container" style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', padding: '10px 0' }}>
      <div className="skeleton-bar" style={{ height: "24px", width: "35%", minHeight: "24px" }}></div>
      <div className="skeleton-bar" style={{ height: "16px", width: "100%", minHeight: "16px" }}></div>
      <div className="skeleton-bar" style={{ height: "16px", width: "90%", minHeight: "16px" }}></div>
      <div className="skeleton-bar" style={{ height: "16px", width: "75%", minHeight: "16px" }}></div>
      <div className="skeleton-bar" style={{ height: "100px", width: "100%", minHeight: "100px", marginTop: "10px" }}></div>
    </div>
  )
}