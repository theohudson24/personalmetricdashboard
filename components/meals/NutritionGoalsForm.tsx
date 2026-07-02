import type { Profile, UserSettings } from "@prisma/client";
import { updateSettings } from "@/app/actions";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Input";
import type { NutritionRecommendation } from "@/lib/recommendations";

export function NutritionGoalsForm({
  settings,
  profile,
  recommendation,
  showProfileMetrics = false,
}: {
  settings: UserSettings;
  profile?: Profile;
  recommendation?: NutritionRecommendation | null;
  showProfileMetrics?: boolean;
}) {
  const heightFeet = profile?.heightInches ? Math.floor(profile.heightInches / 12) : "";
  const heightInchesRemainder = profile?.heightInches
    ? Math.round(profile.heightInches % 12)
    : "";
  const displayedGoals =
    settings.useRecommendedGoals && recommendation
      ? recommendation
      : {
          dailyCalorieGoal: settings.dailyCalorieGoal,
          dailyProteinGoal: settings.dailyProteinGoal,
          dailyCarbGoal: settings.dailyCarbGoal,
          dailyFatGoal: settings.dailyFatGoal,
          dailyFiberGoal: settings.dailyFiberGoal,
          dailyWaterGoal: settings.dailyWaterGoal,
          dailyVitaminAGoal: settings.dailyVitaminAGoal,
          dailyVitaminCGoal: settings.dailyVitaminCGoal,
          dailyVitaminDGoal: settings.dailyVitaminDGoal,
          dailyVitaminB12Goal: settings.dailyVitaminB12Goal,
          dailyCalciumGoal: settings.dailyCalciumGoal,
          dailyIronGoal: settings.dailyIronGoal,
          dailyMagnesiumGoal: settings.dailyMagnesiumGoal,
          dailyPotassiumGoal: settings.dailyPotassiumGoal,
          dailyZincGoal: settings.dailyZincGoal,
          dailySodiumLimit: settings.dailySodiumLimit,
        };

  return (
    <Card>
      <CardHeader
        title="Daily nutrition goals"
        description="Use estimated targets from your body metrics or enter custom goals."
      />
      <form action={updateSettings} className="space-y-4">
        {showProfileMetrics ? (
          <>
            <input type="hidden" name="includeProfileMetrics" value="true" />
            <div className="rounded-md border border-line bg-neutral-50 p-3">
              <h3 className="text-sm font-semibold">Profile metrics</h3>
              <p className="mt-1 text-sm text-muted">
                Height and weight are used to estimate default nutrition targets.
              </p>
              {!recommendation ? (
                <p className="mt-3 rounded-md border border-line bg-white p-3 text-sm text-neutral-700">
                Add your height, weight, age, and gender to generate recommended daily goals.
              </p>
            ) : null}
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Height ft">
                  <Input
                    name="heightFeet"
                    type="number"
                    min="0"
                    defaultValue={heightFeet}
                  />
                </Field>
                <Field label="Height in">
                  <Input
                    name="heightInchesRemainder"
                    type="number"
                    min="0"
                    max="11"
                    defaultValue={heightInchesRemainder}
                  />
                </Field>
                <Field label="Weight lb">
                  <Input
                    name="weightLb"
                    type="number"
                    min="0"
                    step="0.1"
                    defaultValue={profile?.weightLb ?? ""}
                  />
                </Field>
                <Field label="Age">
                  <Input
                    name="age"
                    type="number"
                    min="0"
                    defaultValue={profile?.age ?? ""}
                  />
                </Field>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Gender
                  </span>
                  <select
                    name="gender"
                    defaultValue={profile?.gender ?? ""}
                    className="min-h-11 w-full rounded-md border border-line bg-white px-3 text-sm text-ink transition focus:border-ink"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </label>
              </div>
            </div>

            {recommendation ? (
              <div className="rounded-md border border-line bg-neutral-50 p-3">
                <h3 className="text-sm font-semibold">Recommended estimate</h3>
                <p className="mt-1 text-sm text-muted">
                  Based on height, weight, BMI {recommendation.bmi}, and common fitness nutrition heuristics.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <span>Calories: {recommendation.dailyCalorieGoal}</span>
                  <span>Protein: {recommendation.dailyProteinGoal}g</span>
                  <span>Carbs: {recommendation.dailyCarbGoal}g</span>
                  <span>Fat: {recommendation.dailyFatGoal}g</span>
                  <span>Fiber: {recommendation.dailyFiberGoal}g</span>
                  <span>Water: {recommendation.dailyWaterGoal} oz</span>
                  <span>Vitamin A: {recommendation.dailyVitaminAGoal} mcg</span>
                  <span>Vitamin C: {recommendation.dailyVitaminCGoal} mg</span>
                  <span>Vitamin D: {recommendation.dailyVitaminDGoal} mcg</span>
                  <span>Vitamin B12: {recommendation.dailyVitaminB12Goal} mcg</span>
                  <span>Calcium: {recommendation.dailyCalciumGoal} mg</span>
                  <span>Iron: {recommendation.dailyIronGoal} mg</span>
                  <span>Magnesium: {recommendation.dailyMagnesiumGoal} mg</span>
                  <span>Potassium: {recommendation.dailyPotassiumGoal} mg</span>
                  <span>Zinc: {recommendation.dailyZincGoal} mg</span>
                  <span>Sodium limit: {recommendation.dailySodiumLimit} mg</span>
                </div>
              </div>
            ) : null}
          </>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Calories">
            <Input
              name="dailyCalorieGoal"
              type="number"
              defaultValue={displayedGoals.dailyCalorieGoal}
            />
          </Field>
          <Field label="Protein g">
            <Input
              name="dailyProteinGoal"
              type="number"
              defaultValue={displayedGoals.dailyProteinGoal}
            />
          </Field>
          <Field label="Carbs g">
            <Input
              name="dailyCarbGoal"
              type="number"
              defaultValue={displayedGoals.dailyCarbGoal}
            />
          </Field>
          <Field label="Fat g">
            <Input
              name="dailyFatGoal"
              type="number"
              defaultValue={displayedGoals.dailyFatGoal}
            />
          </Field>
          <Field label="Fiber g">
            <Input
              name="dailyFiberGoal"
              type="number"
              defaultValue={displayedGoals.dailyFiberGoal}
            />
          </Field>
          <Field label="Water oz">
            <Input
              name="dailyWaterGoal"
              type="number"
              defaultValue={displayedGoals.dailyWaterGoal}
            />
          </Field>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold">Daily micronutrient goals</h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Vitamin A mcg RAE">
              <Input name="dailyVitaminAGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyVitaminAGoal} />
            </Field>
            <Field label="Vitamin C mg">
              <Input name="dailyVitaminCGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyVitaminCGoal} />
            </Field>
            <Field label="Vitamin D mcg">
              <Input name="dailyVitaminDGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyVitaminDGoal} />
            </Field>
            <Field label="Vitamin B12 mcg">
              <Input name="dailyVitaminB12Goal" type="number" step="0.1" defaultValue={displayedGoals.dailyVitaminB12Goal} />
            </Field>
            <Field label="Calcium mg">
              <Input name="dailyCalciumGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyCalciumGoal} />
            </Field>
            <Field label="Iron mg">
              <Input name="dailyIronGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyIronGoal} />
            </Field>
            <Field label="Magnesium mg">
              <Input name="dailyMagnesiumGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyMagnesiumGoal} />
            </Field>
            <Field label="Potassium mg">
              <Input name="dailyPotassiumGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyPotassiumGoal} />
            </Field>
            <Field label="Zinc mg">
              <Input name="dailyZincGoal" type="number" step="0.1" defaultValue={displayedGoals.dailyZincGoal} />
            </Field>
            <Field label="Sodium limit mg">
              <Input name="dailySodiumLimit" type="number" step="0.1" defaultValue={displayedGoals.dailySodiumLimit} />
            </Field>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {showProfileMetrics ? (
            <Button name="goalMode" value="recommended">
              Save recommended estimate
            </Button>
          ) : null}
          <Button
            name="goalMode"
            value="custom"
            variant={showProfileMetrics ? "secondary" : "primary"}
          >
            Save custom goals
          </Button>
        </div>
      </form>
    </Card>
  );
}
