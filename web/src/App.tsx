import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import zod from "zod";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { ZipLibs } from "./lib/zip";

const schema = zod.object({
  current: zod.number().default(1),
  step: zod.number().min(0.01).max(5).default(0.01),
  count: zod.number().min(1).max(8).default(1),
});
type Schema = zod.infer<typeof schema>;
type Stage = "INDEX" | "BLOBS";

function App() {
  const [info, setInfo] = useState<{ title: string; duration: number }>();
  const [blobs, setBlobs] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("INDEX");
  const [page, setPage] = useState<number>(0);
  const { register, handleSubmit, watch, setValue, getValues } =
    useForm<Schema>({
      resolver: zodResolver(schema),
      defaultValues: { count: 1, current: 0, step: 1 },
    });
  const [fields, setFields] = useState<Partial<Schema>>();
  const disabled = !info;

  useEffect(() => {
    const defaultValues = getValues();
    setFields(defaultValues);
  }, [getValues]);

  useEffect(() => {
    watch((state) => {
      setFields(state);
    });
  }, [watch]);

  const onSubmit = handleSubmit((form) => {
    if (info === undefined || form.current > info.duration) {
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs.at(0);
      if (tab && tab.id !== undefined) {
        const { current, step, count } = form;
        const message = {
          type: "CAPTURE",
          current,
          step,
          count,
          duration: info.duration,
        };
        chrome.tabs.sendMessage(tab.id, message, (resp) => {
          if ("blobs" in resp) {
            setBlobs(resp.blobs as string[]);
            setStage("BLOBS");
            setPage(0);
          }
        });
      }
    });
  });

  const onCurrentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.valueAsNumber;
    if (isNaN(value)) {
      return;
    }
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs.at(0);
      if (tab && tab.id !== undefined) {
        const message = {
          type: "CHANGE",
          time: value,
        };
        chrome.tabs.sendMessage(tab.id, message, (resp) => {});
      }
    });
  };

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const tab = tabs.at(0);
      if (tab && tab.id !== undefined) {
        chrome.tabs.sendMessage(tab.id, { type: "INFO" }, (resp) => {
          if (resp instanceof Object && "title" in resp) {
            setInfo(resp);
          }
        });
      }
    });
  }, []);
  return (
    <div className="flex flex-col w-full gap-y-2">
      <div className="flex flex-col w-full gap-y-2">
        <div className="flex items-center p-2 bg-gray-800 gap-x-2">
          <img src="/icon-192.png" className="w-7" />
          <h1 className="text-base font-semibold text-white">USE CAPTURE</h1>
        </div>
        {info && (
          <p className="text-base font-light text-center">{info.title}</p>
        )}
      </div>
      {disabled && (
        <div className="flex items-center w-full p-2">
          <p className="text-sm font-light text-red-500 border-b border-red-500">
            This form will be enabled on Youtube.
          </p>
        </div>
      )}
      <div className="flex flex-col px-2 py-1 pb-3 gap-y-3">
        {info && stage === "INDEX" && (
          <div className="w-full">
            <p className="text-sm font-medium">
              Video duration: <span>{info.duration}s</span>
            </p>
          </div>
        )}
        {stage === "INDEX" && (
          <form
            className="flex flex-col w-full gap-y-2"
            method="GET"
            onSubmit={onSubmit}
          >
            <div className="flex flex-col items-start gap-y-1">
              <div className="flex items-center justify-between w-full">
                <Label htmlFor="current" className="text-base">
                  Current
                </Label>
                <Input
                  type="number"
                  className="w-[120px] text-sm h-7"
                  value={fields?.current}
                  disabled={disabled}
                  onChange={(event) => {
                    const value = event.target.valueAsNumber;
                    if (!isNaN(value)) {
                      setValue("current", value, { shouldValidate: true });
                      onCurrentChange(event);
                    }
                  }}
                />
              </div>
              <input
                type="range"
                id="current"
                className="w-full"
                min={0}
                disabled={disabled}
                max={info?.duration}
                step={1}
                {...register("current", {
                  valueAsNumber: true,
                  onChange(event) {
                    onCurrentChange(event);
                  },
                })}
              />
              <div className="flex justify-between w-full px-1">
                <p className="text-sm">0</p>
                <p className="text-sm">{info?.duration}</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-y-1">
              <div className="flex items-center justify-between w-full">
                <Label htmlFor="step" className="text-base">
                  Step
                </Label>
                <p>{fields?.step}</p>
              </div>
              <input
                type="range"
                id="step"
                className="w-full"
                min={0.01}
                max={5}
                step={0.01}
                disabled={disabled}
                {...register("step", { valueAsNumber: true })}
              />
              <div className="flex justify-between w-full px-1">
                <p className="text-sm">0</p>
                <p className="text-sm">5</p>
              </div>
            </div>
            <div className="flex flex-col items-start gap-y-1">
              <div className="flex items-center justify-between w-full">
                <Label htmlFor="count" className="text-base">
                  Count
                </Label>
                <p>{fields?.count}</p>
              </div>
              <input
                type="range"
                id="count"
                className="w-full"
                min={1}
                max={8}
                step={1}
                disabled={disabled}
                {...register("count", { valueAsNumber: true })}
              />
              <div className="flex justify-between w-full px-1">
                <p className="text-sm">1</p>
                <p className="text-sm">8</p>
              </div>
            </div>
            <Button type="submit">Capture</Button>
          </form>
        )}
        {stage === "INDEX" && blobs.length > 0 && (
          <button
            onClick={() => setStage("BLOBS")}
            className="flex justify-start"
          >
            <span className="text-sm font-light text-blue-500 border-b border-blue-500">
              Go to capture
            </span>
          </button>
        )}
        {stage === "BLOBS" && (
          <div className="flex flex-col w-full p-1 gap-y-2">
            <div className="flex items-center justify-between w-full gap-x-2">
              <button
                className="p-0 text-sm text-black bg-transparent"
                onClick={() => {
                  setStage("INDEX");
                }}
              >
                Back
              </button>
              <div className="flex items-center gap-x-2">
                <button
                  onClick={() => {
                    if (page === 0) {
                      setPage(blobs.length - 1);
                    } else {
                      setPage((page) => page - 1);
                    }
                  }}
                >
                  <ChevronLeft />
                </button>
                <button
                  onClick={() => {
                    if (page === blobs.length - 1) {
                      setPage(0);
                    } else {
                      setPage((page) => page + 1);
                    }
                  }}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
            <div className="w-full">
              <img
                src={blobs[page]}
                alt="Images captured"
                className="object-cover w-full"
              />
            </div>
            <div className="flex">
              <button
                onClick={() => {
                  ZipLibs.download(blobs.map((b) => b.split(",")[1]));
                }}
              >
                <span className="text-blue-500 border-b border-blue-500">
                  Save
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
