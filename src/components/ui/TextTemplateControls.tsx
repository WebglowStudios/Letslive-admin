"use client";

import React from "react";
import TemplateControls from "./TemplateControls";

interface Props {
  label: string;
  category: "description";
  text: string;
  onChange: (text: string) => void;
}

export default function TextTemplateControls({ label, category, text, onChange }: Props) {
  // We adapt the single string into an array of 1 item for TemplateControls
  const items = text ? [text] : [];

  const handleTemplateChange = (newItems: string[]) => {
    // Take the first item, or empty string if none
    // If multiple items are somehow saved, join them with newlines
    onChange(newItems.join('\n'));
  };

  return (
    <TemplateControls
      label={label}
      category={category}
      items={items}
      onChange={handleTemplateChange}
    />
  );
}
