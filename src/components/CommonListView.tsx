import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchFilter } from "@/components/SearchFilter";
import { ViewToggle } from "@/components/ViewToggle";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColumnConfig {
  label: string;
  field: string;
  type?: "text" | "badge";
  badgeColor?: (value: any) => string;
}

interface CommonListViewProps {
  title: string;
  subtitle: string;

  api: any;
  fetchUrl: string;
  deleteUrl: (id: string) => string;

  dataKey: string; // example: "weaver", "task", "orders"

  columns: ColumnConfig[];
  searchFields: string[];

  filterOptions?: any;

  onNew: () => void;
  onView: (row: any) => void;
  onEdit: (row: any) => void;
  onDeleteSuccess?: (id: string) => void;
  refreshKey?: number;
}

export const CommonListView: React.FC<CommonListViewProps> = ({
  title,
  subtitle,
  api,
  fetchUrl,
  deleteUrl,
  dataKey,
  columns,
  searchFields,
  filterOptions,
  onNew,
  onView,
  onEdit,
  onDeleteSuccess,
  refreshKey,
}) => {
  const [data, setData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [view, setView] = useState<"list" | "grid">("list");
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const response = await api.get(fetchUrl);
        const result = response.data[dataKey] || [];

        setData(result);
        setFilteredData(result);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.response?.data?.error || "Failed to fetch data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [title, refreshKey]);

  const handleSearch = (query: string) => {
    if (!query.trim()) {
      setFilteredData(data);
      return;
    }

    const filtered = data.filter((item) =>
      searchFields.some((field) =>
        item[field]?.toString().toLowerCase().includes(query.toLowerCase()),
      ),
    );

    setFilteredData(filtered);
  };

  const handleFilter = (filters: any) => {
    let filtered = [...data];

    Object.keys(filters).forEach((key) => {
      if (filters[key]) {
        filtered = filtered.filter((item) => item[key] === filters[key]);
      }
    });

    setFilteredData(filtered);
  };

  const handleClearFilters = () => {
    setFilteredData(data);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;

    setLoading(true);

    try {
      await api.delete(deleteUrl(id));

      setData((prev) => prev.filter((d) => d.id !== id));
      setFilteredData((prev) => prev.filter((d) => d.id !== id));

      toast({
        title: "Success",
        description: "Deleted successfully",
      });

      if (onDeleteSuccess) onDeleteSuccess(id);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.response?.data?.error || "Delete failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const ThreeDots = () => (
    <div className="flex space-x-2">
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
      <div className="h-2 w-2 bg-gray-600 rounded-full animate-bounce delay-400"></div>
    </div>
  );

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <ThreeDots />
        </div>
      )}

      <div
        className={`${loading ? "blur-sm pointer-events-none select-none" : ""}`}
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">{subtitle}</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-2 flex-1 sm:mr-4">
                <SearchFilter
                  onSearch={handleSearch}
                  onFilter={handleFilter}
                  onClearFilters={handleClearFilters}
                  filterOptions={filterOptions}
                  placeholder={`Search ${title.toLowerCase()}...`}
                />
                <ViewToggle view={view} onViewChange={setView} />
              </div>

              <Button
                onClick={onNew}
                className="w-full sm:w-auto text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-10"
              >
                <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                New
              </Button>
            </div>
          </div>

          {/* List/Grid */}
          <Card>
            <CardHeader>
              <CardTitle>{title} List</CardTitle>
            </CardHeader>

            {/* <CardContent>
              {view === "list" ? (
                <div className="space-y-4">
                  {filteredData.map((row) => (
                    <Card key={row.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4 sm:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
                          <div>
                            <h3 className="text-lg sm:text-xl font-bold">
                             ID:  {row.name || row.title || row.id}
                            </h3>
                       
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onView(row)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onEdit(row)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => handleDelete(row.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {columns.map((col) => (
                            <div key={col.field}>
                              <p className="text-sm text-gray-600">
                                {col.label}
                              </p>

                              {col.type === "badge" ? (
                                <Badge
                                  className={
                                    col.badgeColor
                                      ? col.badgeColor(row[col.field])
                                      : "bg-gray-100 text-gray-700"
                                  }
                                >
                                  {row[col.field]}
                                </Badge>
                              ) : (
                                <p className="font-medium">
                                  {row[col.field] || "-"}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredData.map((row) => (
                    <Card key={row.id} className="h-full">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-bold mb-3">
                          {row.name || row.title || row.id}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {columns.slice(0, 3).map((col) => (
                            <div key={col.field}>
                              <p className="text-sm text-gray-600">
                                {col.label}
                              </p>
                              <p className="font-medium text-sm">
                                {row[col.field] || "-"}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onView(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onEdit(row)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent> */}

            {/* <CardContent>
              
              <div className="divide-y">
                {filteredData.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {row.name || row.title || row.id}
                      </h3>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                        {columns.map((col) => (
                          <div key={col.field} className="text-sm">
                            <span className="text-gray-500">{col.label}: </span>

                            {col.type === "badge" ? (
                              <Badge
                                className={
                                  col.badgeColor
                                    ? col.badgeColor(row[col.field])
                                    : "bg-gray-100 text-gray-700"
                                }
                              >
                                {row[col.field]}
                              </Badge>
                            ) : (
                              <span className="font-medium">
                                {row[col.field] || "-"}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onView(row)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(row)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDelete(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent> */}

            <CardContent>
              {view === "list" ? (
                /* ===== Traditional List View (grid stays the same) ===== */

                <div className="divide-y">
                  {filteredData.map((row) => (
                    <div
                      key={row.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">
                          {row.name || row.title || row.id}
                        </h3>

                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
                          {columns.map((col) => (
                            <div key={col.field} className="text-sm">
                              <span className="text-gray-500">
                                {col.label}:{" "}
                              </span>

                              {col.type === "badge" ? (
                                <Badge
                                  className={
                                    col.badgeColor
                                      ? col.badgeColor(row[col.field])
                                      : "bg-gray-100 text-gray-700"
                                  }
                                >
                                  {row[col.field]}
                                </Badge>
                              ) : (
                                <span className="font-medium">
                                  {row[col.field] || "-"}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        {/* <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onView(row)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button> */}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(row)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(row.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* ===== Grid View (UNCHANGED) ===== */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredData.map((row) => (
                    <Card key={row.id} className="h-full">
                      <CardContent className="p-4">
                        <h3 className="text-lg font-bold mb-3">
                          {row.name || row.title || row.id}
                        </h3>

                        <div className="space-y-2 mb-4">
                          {columns.slice(0, 3).map((col) => (
                            <div key={col.field}>
                              <p className="text-sm text-gray-600">
                                {col.label}
                              </p>
                              <p className="font-medium text-sm">
                                {row[col.field] || "-"}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="flex space-x-1">
                          {/* <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onView(row)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button> */}

                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => onEdit(row)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(row.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
