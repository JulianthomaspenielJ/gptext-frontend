import { useState } from "react";
import { useParams } from "react-router-dom";
import { CommonListView } from "@/components/CommonListView";
import formConfig from "@/config/formconfig.json";

import { CommonDynamicForm } from "@/components/CommomDynamicForm";

import { commonApi } from "@/services/api2";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "./ui/dialog";

const formMap: any = {
  common: commonApi,
};

const apiMap: any = {
  common: commonApi,
};

export default function CommonManagement() {
  const { type } = useParams(); // example: /master/weaver
  const config = (formConfig as any)[type as string];
  console.log(config);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [mode, setMode] = useState<"create" | "edit" | "view">("create");
  const [refreshKey, setRefreshKey] = useState(0);

  if (!config) {
    return <div className="p-4 text-red-500">Invalid Master Type</div>;
  }

  const FormComponent = formMap[type as string];
  const api = apiMap["common"];

  // console.log(api);
  const handleSubmit = async (data: any) => {
    try {
      const payload = {
        data: { ...data, id: selectedRow.id },
        context: { type, mode },
      };

      await api.post(config.saveUrl, payload);
      setIsFormOpen(false);
      setRefreshKey((prev) => prev + 1); // 👈 triggers reload
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  return (
    <>
      <CommonListView
        title={config.title}
        subtitle={config.subtitle}
        api={api}
        fetchUrl={`${config.fetchUrl}?type=${type}`}
        // fetchUrl={config.fetchUrl}
        deleteUrl={(id: any) => `${config.deleteUrl}/${id}?type=${  type}`}
        dataKey={config.dataKey}
        searchFields={config.searchFields}
        filterOptions={config.filterOptions}
        columns={config.columns.map((col: any) => {
          if (col.type === "badge" && col.field === "status") {
            return {
              ...col,
              badgeColor: (val: any) =>
                val === "Active"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white",
            };
          }
          return col;
        })}
        onNew={() => {
          setSelectedRow(null);
          setMode("create");
          setIsFormOpen(true);
        }}
        onView={(row: any) => {
          setSelectedRow(row);
          setMode("view");
          setIsFormOpen(true);
        }}
        onEdit={(row: any) => {
          setSelectedRow(row);
          setMode("edit");
          setIsFormOpen(true);
        }}
        refreshKey={refreshKey}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{config.title}</DialogTitle>
          </DialogHeader>

          <CommonDynamicForm
            fields={config.fields}
            onSubmit={handleSubmit}
            onCancel={() => setIsFormOpen(false)}
            submitText="Save"
            initialValues={selectedRow}
          />
        </DialogContent>
      </Dialog>

      {FormComponent && (
        <FormComponent
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSave={() => setIsFormOpen(false)}
          data={selectedRow}
          mode={mode}
        />
      )}
    </>
  );
}
