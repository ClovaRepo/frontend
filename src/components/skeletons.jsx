"use client";
/* On-brand skeleton placeholders shown while a screen chunk loads. */
import React from "react";

const sk = (style) => <div className="skeleton" style={style} />;

export function MobileSkeleton() {
  return (
    <div className="screen" style={{ padding: "20px 16px", animation: "none" }}>
      <div className="row between aic" style={{ marginBottom: 18 }}>
        {sk({ height: 22, width: 92, borderRadius: 8 })}
        {sk({ height: 38, width: 38, borderRadius: "50%" })}
      </div>
      {sk({ height: 168, borderRadius: 24, marginBottom: 14 })}
      {sk({ height: 118, borderRadius: 22, marginBottom: 14 })}
      <div className="row gap-12">
        {sk({ height: 92, borderRadius: 18, flex: 1 })}
        {sk({ height: 92, borderRadius: 18, flex: 1 })}
      </div>
    </div>
  );
}

export function WebSkeleton() {
  return (
    <div className="main">
      <div className="main-head">
        <div>
          {sk({ height: 26, width: 210, borderRadius: 10 })}
          {sk({ height: 12, width: 150, borderRadius: 8, marginTop: 9 })}
        </div>
        {sk({ height: 40, width: 168, borderRadius: 14 })}
      </div>
      <div className="main-body">
        <div className="bento">
          <div className="col-7">{sk({ height: 264, borderRadius: 26 })}</div>
          <div className="col-5">{sk({ height: 264, borderRadius: 26 })}</div>
          <div className="col-4">{sk({ height: 150, borderRadius: 26 })}</div>
          <div className="col-4">{sk({ height: 150, borderRadius: 26 })}</div>
          <div className="col-4">{sk({ height: 150, borderRadius: 26 })}</div>
        </div>
      </div>
    </div>
  );
}

/* Rendered inside .web-onboard-col, so it's just the step content. */
export function OnboardSkeleton() {
  return (
    <>
      {sk({ height: 14, width: "62%", borderRadius: 8, margin: "6px auto 20px" })}
      {sk({ height: 340, borderRadius: 26 })}
    </>
  );
}
