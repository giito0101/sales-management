import { describe, it, expect } from "vitest";
import {
  buildJobSeekerListUrl,
  formatDateTime,
  getNextSortOrder,
  statusLabel,
} from "./jobSeekerTableUtils";

describe("jobSeekerTableUtils", () => {
  it("statusLabel がステータスを日本語ラベルに変換する", () => {
    expect(statusLabel("NEW")).toBe("新規");
    expect(statusLabel("OFFERED")).toBe("内定");
  });

  it("formatDateTime が日本語形式で日時を返す", () => {
    const iso = "2024-01-02T03:04:05.000Z";
    const expected = new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

    expect(formatDateTime(iso)).toBe(expected);
  });

  it("buildJobSeekerListUrl が q を追加・更新・削除する", () => {
    const added = buildJobSeekerListUrl("sortKey=id&sortOrder=asc", {
      q: "営業 太郎",
    });
    const addedParams = new URL(added, "http://localhost").searchParams;
    expect(addedParams.get("q")).toBe("営業 太郎");
    expect(addedParams.get("sortKey")).toBe("id");
    expect(addedParams.get("sortOrder")).toBe("asc");

    const updated = buildJobSeekerListUrl("q=old&sortKey=id", {
      q: "new",
    });
    const updatedParams = new URL(updated, "http://localhost").searchParams;
    expect(updatedParams.get("q")).toBe("new");
    expect(updatedParams.get("sortKey")).toBe("id");

    const deleted = buildJobSeekerListUrl("q=foo&sortKey=name&sortOrder=desc", {
      q: "",
    });
    const deletedParams = new URL(deleted, "http://localhost").searchParams;
    expect(deletedParams.get("q")).toBeNull();
    expect(deletedParams.get("sortKey")).toBe("name");
    expect(deletedParams.get("sortOrder")).toBe("desc");
  });

  it("buildJobSeekerListUrl が sortKey/sortOrder を更新する", () => {
    const url = buildJobSeekerListUrl("q=foo&sortKey=id&sortOrder=asc", {
      sortKey: "name",
      sortOrder: "desc",
    });
    const params = new URL(url, "http://localhost").searchParams;
    expect(params.get("q")).toBe("foo");
    expect(params.get("sortKey")).toBe("name");
    expect(params.get("sortOrder")).toBe("desc");
  });

  it("getNextSortOrder が同一キーで asc/desc を切り替える", () => {
    expect(
      getNextSortOrder({
        currentSortKey: "id",
        currentSortOrder: "asc",
        nextKey: "id",
      })
    ).toBe("desc");

    expect(
      getNextSortOrder({
        currentSortKey: "name",
        currentSortOrder: "desc",
        nextKey: "name",
      })
    ).toBe("asc");
  });

  it("getNextSortOrder がキー変更時のデフォルト順序を返す", () => {
    expect(
      getNextSortOrder({
        currentSortKey: "id",
        currentSortOrder: "desc",
        nextKey: "updatedAt",
      })
    ).toBe("desc");

    expect(
      getNextSortOrder({
        currentSortKey: "updatedAt",
        currentSortOrder: "desc",
        nextKey: "name",
      })
    ).toBe("asc");
  });
});
