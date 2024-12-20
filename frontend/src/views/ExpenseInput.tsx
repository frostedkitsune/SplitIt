import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TypographyH3 } from "@/components/ui/typography-h3";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banana, Clapperboard, HeartPulse, House } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { userAtom } from "@/lib/user";
import { useAtom } from "jotai";

const expenseSchema = z.object({
  title: z.string().min(1, { message: "Title is required." }),
  date: z.date().refine((date) => !isNaN(date.getTime()), {
    message: "Date is required.",
  }),
  category: z.string().min(1, { message: "Category is required." }),
  amount: z.string().min(0, { message: "Amount must be greater than 0." }),
  message: z.string().optional(),
  payer: z.string()
});

export default function ExpenseInput() {
  const [disable, setDisable] = useState(false)
  const [profiles, setprofiles] = useState([]);
  const [user] = useAtom(userAtom);
  const [selectedItems, setSelectedItems] = useState([]);
  const [splitType, setSplitType] = useState("default");
  const [memberAmounts, setMemberAmounts] = useState(profiles.map(() => ""));

  const GroupId: string = useParams().id!;

  const handleSplitTypeChange = (value: any) => {
    setSplitType(value);
  };

  const handleAmountChange = (index: any, value: any) => {
    console.log("sd", value.length, index);

    const newAmounts = [...memberAmounts];
    newAmounts[index] = value || 0
    setMemberAmounts(newAmounts);
  };

  useEffect(() => {
    console.log("memberamount from useEffect: ", memberAmounts);

  }, [memberAmounts])
  const validateAmounts = () => {
    const totalAmount = parseFloat(form.getValues("amount"));
    console.log("memberamount: ", memberAmounts);
    // Default case
    if (splitType === "default") {
      return true;
    }
    else if (splitType === "money") {
      const totalMoney = memberAmounts.reduce((acc, amount) => acc + (parseFloat(amount) || 0), 0);
      return totalMoney === totalAmount && (selectedItems.length === memberAmounts.length);
    } else if (splitType === "fraction") {
      const totalFraction = memberAmounts.reduce((acc, amount) => acc + (parseFloat(amount) || 0), 0);
      return totalFraction === memberAmounts.length && (selectedItems.length === memberAmounts.length);
    }
  };

  const onSubmit = async (values: z.infer<typeof expenseSchema>) => {
    if (!validateAmounts()) {
      console.error("Invalid amounts for the selected split type.");
      return;
    }
    // Calculate split amounts based on the selected type
    // @ts-ignore
    let splitAmounts;
    if (splitType === "default") {
      splitAmounts = selectedItems.map(() => { return (100 / selectedItems.length).toFixed(2) })
      console.log("default: ", splitAmounts);

    }
    else {
      splitAmounts = memberAmounts.map((amount) => {
        if (splitType === "money") {
          return (parseFloat(amount) / parseFloat(values.amount)) * 100;
        } else if (splitType === "fraction") {
          return (parseFloat(amount) * 100 / memberAmounts.length);
        }
      });
    }

    console.log("proffff", profiles);
    console.log("values", values, "splitamount", splitAmounts);
    const ExpenseDivisions = selectedItems.map((user: any, index) => ({
      Username: user,
      Percentage: splitAmounts[index] // Handle case where moneys array is shorter
    }))
    console.log("ExpenseDivisions", ExpenseDivisions);

    console.log(await (await fetch(`/api/groups/${GroupId}/expense`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: 'POST',
      body: JSON.stringify({
        ExpenseTitle: values.title, Date: values.date, Category: values.category, Purpose: values.message, Amount: values.amount, Payer: values.payer, DivisionType: splitType, ExpenseDivisions: selectedItems.map((user: any, index) => ({
          Username: user,
          Percentage: splitAmounts[index] // Handle case where moneys array is shorter
        }))
      })
    })).text());
    // form.reset();
    // history.back()
  };

  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      date: new Date(), //toISOString().split('T')[0],
      category: "",
      amount: "",
      message: "",
      payer: user?.username || "ee"
    },
  });
  const { control, handleSubmit } = form;


  const handleToggleChange = (value: any) => {
    setSelectedItems((prevSelected: any) => {
      if (prevSelected.includes(value)) {
        // If the item is already selected, remove it
        return prevSelected.filter((item: any) => item !== value);
      } else {
        // If the item is not selected, add it
        return [...prevSelected, value];
      }
    });
  };

  useEffect(() => {
    (async () => {
      setprofiles(await (await fetch(`/api/groups/${GroupId}/members`)).json());
    })();
  }, [])
  useEffect(() => {
    splitType === "default" ? setDisable(true) : setDisable(false)
  }, [splitType])

  function handleSelectAll() {
    console.log("not implemented yet");

    // profiles.map((user:any)=>{
    //   handleToggleChange(user.username)
    // })
  }

  return (
    <div className="-ml-4 grid w-screen justify-center content-start gap-4 pt-4">
      <TypographyH3>Add Expense</TypographyH3>


      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid w-[80vw] gap-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Type a suitable title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <DatePicker
                    value={field.value} // Set the selected date
                    onChange={(date: any) => field.onChange(date)} // Update the form state
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select {...field} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entertainment">
                        <span className="flex flex-row items-center font-normal">
                          <Clapperboard size={16} className="mr-2" />
                          Entertainment
                        </span>
                      </SelectItem>
                      <SelectItem value="food">
                        <span className="flex flex-row items-center font-normal">
                          <Banana size={16} className="mr-2" />
                          Food
                        </span>
                      </SelectItem>
                      <SelectItem value="medical">
                        <span className="flex flex-row items-center font-normal">
                          <HeartPulse size={16} className="mr-2" />
                          Medical
                        </span>
                      </SelectItem>
                      <SelectItem value="utility">
                        <span className="flex flex-row items-center font-normal">
                          <House size={16} className="mr-2" />
                          Utility
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Amount"
                    {...field}
                    className="no-spinner"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe what you are spending for"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />


          <FormField
            control={control}
            name="payer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Payer</FormLabel>
                <FormControl>
                  <Select {...field} onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a payer" />
                    </SelectTrigger>
                    <SelectContent>
                      {
                        profiles.map((user: any, key) => 
                          (<SelectItem value={user.username} key={key}>{user.name}</SelectItem>))
                      }
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />



          {/* User selection section to select with whom the expense will be split */}
          <ToggleGroup
            type="multiple"
            className="flex-col gap-2 bg-secondary w-80 p-4 rounded-md"
          >
            <div className="flex justify-between items-center w-full mb-4">
              <span onClick={handleSelectAll}>Select all</span>
              <Select onValueChange={handleSplitTypeChange} defaultValue="default">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Split Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="money">By money</SelectItem>
                  <SelectItem value="fraction">By fraction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {profiles.map((user: any, key) => (
              <div key={key} className="flex items-center justify-start w-full">
                <ToggleGroupItem
                  value={user.username}
                  aria-label={user.username}
                  className="data-[state=on]:bg-primary h-14 w-14 px-0.5 py-0 rounded-full mr-4"
                  onClick={() => handleToggleChange(user.username)}
                >
                  <Avatar className="h-12 w-12 rounded-full">
                    <AvatarImage src={user.avatar} alt={user.avatar} />
                    <AvatarFallback>{user.name}</AvatarFallback>
                  </Avatar>
                </ToggleGroupItem>
                <Label htmlFor={`member-${key}`} className="text-base mr-10">
                  {user.name}
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  id={`member-${key}`}
                  className="w-16 no-spinner ml-auto"
                  placeholder=""
                  value={memberAmounts[key]}
                  onChange={(e) => handleAmountChange(key, e.target.value)}
                  disabled={disable}
                />
              </div>
            ))}
          </ToggleGroup>

          <Button type="submit" className="mb-20">Split Expense</Button>
        </form>
      </Form>

    </div>
  )
}
// onClick={() => history.back()}