library(readxl)
library(tidyverse)
library(ggplot2)
library(grid)

# ── Load data ──────────────────────────────────────────────────────────────
# Place ML_LULC_Accuracy.xlsx in the same folder as this script, or update
# the path below to match your directory structure.


file_path <- "ML_LULC_Accuracy.xlsx"

df <- read_excel(file_path)

# ── Column names ───────────────────────────────────────────────────────────
colnames(df) <- c("Algorithm",
                  "Winter_Kappa", "Winter_OA", "Winter_F1",
                  "Spring_Kappa", "Spring_OA", "Spring_F1",
                  "Summer_Kappa", "Summer_OA", "Summer_F1",
                  "Fall_Kappa",   "Fall_F1",   "Fall_OA",
                  "Average_Kappa", "Average_OA", "Average_F1")

# ── Compute seasonal means for OA, Kappa, F1 ──────────────────────────────
oa_means <- df %>%
  summarise(
    Winter = mean(Winter_OA, na.rm = TRUE),
    Spring = mean(Spring_OA, na.rm = TRUE),
    Summer = mean(Summer_OA, na.rm = TRUE),
    Fall   = mean(Fall_OA,   na.rm = TRUE)
  ) %>%
  pivot_longer(everything(), names_to = "Season", values_to = "value") %>%
  mutate(Metric = "OA")

kappa_means <- df %>%
  summarise(
    Winter = mean(Winter_Kappa, na.rm = TRUE),
    Spring = mean(Spring_Kappa, na.rm = TRUE),
    Summer = mean(Summer_Kappa, na.rm = TRUE),
    Fall   = mean(Fall_Kappa,   na.rm = TRUE)
  ) %>%
  pivot_longer(everything(), names_to = "Season", values_to = "value") %>%
  mutate(Metric = "Kappa")

f1_means <- df %>%
  summarise(
    Winter = mean(Winter_F1, na.rm = TRUE),
    Spring = mean(Spring_F1, na.rm = TRUE),
    Summer = mean(Summer_F1, na.rm = TRUE),
    Fall   = mean(Fall_F1,   na.rm = TRUE)
  ) %>%
  pivot_longer(everything(), names_to = "Season", values_to = "value") %>%
  mutate(Metric = "F1")

# ── Combine ────────────────────────────────────────────────────────────────
avg_df <- bind_rows(oa_means, kappa_means, f1_means)

# Order seasons for x-axis
avg_df$Season <- factor(avg_df$Season,
                        levels = c("Winter", "Spring", "Summer", "Fall"))

# ── Rescale F1 to share vertical range with OA/Kappa ──────────────────────
left_min  <- 85    # left axis lower bound (OA/Kappa)
left_max  <- 95    # left axis upper bound
f1_min    <- 0.85  # right axis lower bound
f1_max    <- 1.00  # right axis upper bound

scale_factor <- (left_max - left_min) / (f1_max - f1_min)

avg_df <- avg_df %>%
  mutate(
    y_plot = case_when(
      Metric %in% c("OA", "Kappa") ~ value,
      Metric == "F1" ~ left_min + (value - f1_min) * scale_factor
    ),
    Metric = factor(Metric, levels = c("Kappa", "OA", "F1"))
  )

# ── Plot ───────────────────────────────────────────────────────────────────
ggplot(avg_df, aes(x = Season, y = y_plot, fill = Metric)) +
  geom_col(position = "dodge", width = 0.6) +
  scale_fill_manual(
    values = c(
      "OA"    = "#148F77",  # teal
      "Kappa" = "#922B21",  # dark red
      "F1"    = "#34495E"   # dark blue-gray
    ),
    labels = c("Kappa", "OA", "F1-score"),
    name   = "Accuracy Metric"
  ) +
  scale_y_continuous(
    name   = "Average OA and Kappa (%)",
    breaks = seq(left_min, left_max, 1),
    sec.axis = sec_axis(
      transform = ~ f1_min + (. - left_min) / scale_factor,
      breaks    = seq(f1_min, f1_max, 0.05),
      name      = "Average F1-score"
    )
  ) +
  coord_cartesian(ylim = c(left_min, left_max)) +
  labs(x = "Season") +
  theme_minimal() +
  theme(
    axis.title.y.left  = element_text(face = "bold", size = 14),
    axis.title.y.right = element_text(face = "bold", size = 14),
    axis.text.x  = element_text(angle = 45, hjust = 1,
                                size = 12.5, face = "bold", color = "black"),
    axis.title.x = element_text(face = "bold", size = 14),
    axis.text.y  = element_text(size = 12.5, face = "bold", color = "black"),
    axis.line    = element_line(color = "black", linewidth = 0.8),
    axis.ticks   = element_line(color = "black", linewidth = 0.7),
    panel.grid.major = element_blank(),
    panel.grid.minor = element_blank(),
    legend.title = element_text(size = 13, face = "bold"),
    legend.text  = element_text(size = 12, face = "bold"),
    legend.key.size = unit(0.8, "cm")
  )
