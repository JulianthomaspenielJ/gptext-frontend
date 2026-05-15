import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FieldConfig {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "textarea" | "select";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[]; // for select
  defaultValue?: any;
}

interface DynamicFormProps {
  fields: FieldConfig[];
  onSubmit: (data: any) => void;
  onCancel?: () => void;
  submitText?: string;
  initialValues?: any;
}

export const CommonDynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  onSubmit,
  onCancel,
  submitText = "Submit",
  initialValues
}) => {
  const initialData = fields.reduce((acc: any, field) => {
    // acc[field.name] = field.defaultValue || "";
      acc[field.name] = initialValues?.[field.name] ?? field.defaultValue ?? "";

    return acc;
  }, {});

  const [formData, setFormData] = useState(initialData);

  const handleChange = (name: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData)
    onSubmit(formData);
  };

  console.log("^^^^^^^^^^^^^^^^^^^^^", initialData);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {fields.map((field) => (
        <div key={field.name}>
          <Label htmlFor={field.name}>
            {field.label} {field.required ? "*" : ""}
          </Label>

          {/* TEXTAREA */}
          {field.type === "textarea" && (
            <Textarea
              id={field.name}
              value={formData[field.name]}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          )}

          {/* SELECT */}
          {field.type === "select" && (
            <Select
              value={formData[field.name]}
              onValueChange={(value) => handleChange(field.name, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select"} />
              </SelectTrigger>

              <SelectContent>
                {field.options?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* INPUT */}
          {field.type !== "textarea" && field.type !== "select" && (
            <Input
              id={field.name}
              type={field.type}
              value={formData[field.name]}
              placeholder={field.placeholder}
              onChange={(e) => handleChange(field.name, e.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}

      <div className="flex justify-end gap-3 pt-4 border-t">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit">{submitText}</Button>
      </div>
    </form>
  );
};
