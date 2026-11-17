MAIN = main
LATEXMK = latexmk
LATEXMK_FLAGS = -pdf -interaction=nonstopmode -file-line-error

.PHONY: all clean watch

all: $(MAIN).pdf

$(MAIN).pdf: $(MAIN).tex figures/triangle.tex \
	sections/intro.tex sections/project-hmc.tex \
	sections/project-frp.tex sections/project-fusion.tex \
	sections/close.tex
	$(LATEXMK) $(LATEXMK_FLAGS) $(MAIN).tex

watch:
	$(LATEXMK) $(LATEXMK_FLAGS) -pvc $(MAIN).tex

clean:
	$(LATEXMK) -C $(MAIN).tex
