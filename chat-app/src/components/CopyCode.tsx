import { useEffect } from "react";

function CopyCode() {
    useEffect(() => {
        const addCopyButtons = () => {
            const codeBlocks = document.querySelectorAll<HTMLElement>(".hljs");
            codeBlocks.forEach(block => {
                // Avoid adding multiple buttons
                if (block.querySelector(".copy-btn")) return;

                // Skip if block already has a copy button
                if (block.querySelector(".copy-btn")) return;

                // Create button
                const button = document.createElement("button");
                button.textContent = "Copy Code";
                button.className = "copy-btn absolute top-2 right-2 bg-black/70 text-white px-2 py-1 text-xs rounded cursor-pointer opacity-0 transition-opacity duration-300";
                
                // Copy logic
                button.addEventListener("click", async () => {
                    try {
                        // Create a temporary clone of the code block
                        const tempBlock = block.cloneNode(true) as HTMLElement;
                        
                        // Remove the copy button from the clone
                        const copyBtn = tempBlock.querySelector(".copy-btn");
                        if (copyBtn) {
                            copyBtn.remove();
                        }
                        
                        // Get the clean code text
                        const code = tempBlock.innerText;
                        await navigator.clipboard.writeText(code);
                        
                        button.textContent = "Copied!";
                        setTimeout(() => (button.textContent = "Copy Code"), 2000);
                    } catch (err) {
                        console.error("Copy failed", err);
                    }
                });

                // Style adjustments
                block.style.position = "relative";
                block.appendChild(button);
            });
        };

        // Run once after component mounts
        addCopyButtons();

        // Run again if new code blocks appear (mutation observer)
        const observer = new MutationObserver(addCopyButtons);
        observer.observe(document.body, { childList: true, subtree: true });
        return () => observer.disconnect();
    }, []);

    // no need to return anything
    return null;
}

export default CopyCode;