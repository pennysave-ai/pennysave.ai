import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  LanguageSwitcher,
  SwitchLanguageButton,
} from "@/components/landing/language-switcher";

const refresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const COOKIE = "pennysave-landing-lang";

function clearCookie() {
  document.cookie = `${COOKIE}=; path=/; max-age=0`;
}

describe("LanguageSwitcher", () => {
  afterEach(() => {
    refresh.mockClear();
    localStorage.clear();
    clearCookie();
  });

  it("marks the current language and names each by its own name", () => {
    render(<LanguageSwitcher lang="de" label="Sprache" />);
    const group = screen.getByRole("group", { name: "Sprache" });
    expect(group).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Deutsch" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "English" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("keeps <html lang> in step with the page", () => {
    render(<LanguageSwitcher lang="fr" label="Langue" />);
    expect(document.documentElement.lang).toBe("fr");
  });

  it("saves the choice in the cookie and re-renders on the server", () => {
    render(<LanguageSwitcher lang="en" label="Language" />);
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Español" }));
    });
    expect(document.cookie).toContain(`${COOKIE}=es`);
    expect(localStorage.getItem(COOKIE)).toBe("es");
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("does nothing when the current language is tapped", () => {
    render(<LanguageSwitcher lang="en" label="Language" />);
    fireEvent.click(screen.getByRole("button", { name: "English" }));
    expect(refresh).not.toHaveBeenCalled();
  });

  it("switches from the phone picker too", () => {
    render(<LanguageSwitcher lang="en" label="Language" />);
    act(() => {
      fireEvent.change(screen.getByRole("combobox", { name: "Language" }), {
        target: { value: "de" },
      });
    });
    expect(document.cookie).toContain(`${COOKIE}=de`);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("carries an older saved language over to the cookie and switches to it", () => {
    localStorage.setItem(COOKIE, "fr");
    render(<LanguageSwitcher lang="en" label="Language" />);
    expect(document.cookie).toContain(`${COOKIE}=fr`);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("only writes the cookie when the older saved language is already showing", () => {
    localStorage.setItem(COOKIE, "en");
    render(<LanguageSwitcher lang="en" label="Language" />);
    expect(document.cookie).toContain(`${COOKIE}=en`);
    expect(refresh).not.toHaveBeenCalled();
  });

  it("leaves things alone once the cookie exists", () => {
    localStorage.setItem(COOKIE, "fr");
    document.cookie = `${COOKIE}=en; path=/`;
    render(<LanguageSwitcher lang="en" label="Language" />);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("SwitchLanguageButton", () => {
  afterEach(() => {
    refresh.mockClear();
    clearCookie();
  });

  it("switches the page to its language", () => {
    render(
      <SwitchLanguageButton to="en" className="">
        Read in English
      </SwitchLanguageButton>,
    );
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Read in English" }));
    });
    expect(document.cookie).toContain(`${COOKIE}=en`);
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
