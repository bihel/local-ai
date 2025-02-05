import { useState, useEffect } from "react";

interface ModelDropdownProps {
  onModelSelect: (model: string) => void;
}

export default function ModelDropdown({ onModelSelect }: ModelDropdownProps) {
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const modelList = await getOllamaModels();
        setModels(modelList);
        // Set the first model as default if available
        if (modelList.length > 0) {
          setSelectedModel(modelList[0]);
          onModelSelect(modelList[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch models");
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []); // Only run once when component mounts

  if (loading) return <div className='my-2'>Loading models...</div>;
  if (error) return <div className='my-2 text-red-500'>Error: {error}</div>;
  if (models.length === 0) return <div className='my-2'>No models available</div>;

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    onModelSelect(value);
  };

  return (
    <div className='my-2'>
      <select
        className='bg-gray-800 text-white rounded-lg p-2 border border-gray-600'
        value={selectedModel ?? ""}
        onChange={e => handleModelChange(e.target.value)}>
        <option value=''>Select a model</option>
        {models.sort().map((model, index) => (
          <option key={index} value={model}>
            {model}
          </option>
        ))}
      </select>
    </div>
  );
}

interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

async function getOllamaModels(): Promise<string[]> {
  try {
    const response = await fetch("http://localhost:11434/api/tags");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { models: OllamaModel[] };

    // Extract just the names from the models array
    return data.models.map(model => model.name);
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    throw error;
  }
}
